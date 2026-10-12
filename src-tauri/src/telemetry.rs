//! Sentry reporting for the Rust side of the app.
//!
//! The WebView already reports its own errors (`sentry.client.config.ts`),
//! but nothing here did: a Rust failure existed only as a line on a stderr
//! no desktop user ever reads, so a background installer that 404s showed as
//! a spinner that never resolves and produced no signal at all.
//!
//! Deliberately the native Rust SDK rather than a Tauri event the WebView
//! turns into `Sentry.captureException`:
//!
//! - The WebView runs the DEPLOYED web app, which versions independently of
//!   this binary, so a listener for a new event may simply not exist on a
//!   user's machine — reporting that silently stops working is worse than
//!   none.
//! - A bridge covers nothing before the WebView loads: all of `setup()` and
//!   the installers spawned there, which is where the failures worth knowing
//!   about happen.
//! - Rust frames would arrive as JavaScript-platform events and group as
//!   noise.
//!
//! Reports into the same self-hosted project as the web app. Unlike that
//! side — whose DSN arrives as `NEXT_PUBLIC_IBL_SENTRY_DSN` at deploy time and
//! which stays inert without it — a desktop binary has no deploy-time env, so
//! the DSN is resolved at runtime, then from what `build.rs` baked, then from
//! [`DEFAULT_DSN`], which is this app's own project and needs no setup. Two things keep the Rust events findable in a project the
//! whole product reports to: the `runtime` tag below, and a `release` of
//! `skillsai@<version>` rather than the web app's.
//!
//! Grouping is safe to share because every [`report`] sets its own
//! `fingerprint` and panics group on the Rust stack — nothing here leans on
//! Sentry's default algorithm. Splitting later needs no code change: set
//! `IBL_SENTRY_DSN_DESKTOP` to a new project's DSN.
//!
//! Twin of mentorai's `src-tauri/src/telemetry.rs`, minus what this app has
//! no owner for: there is no `settings.json`, so the opt-out is the env var
//! alone, and the install id is handed in from `setup()` (see
//! [`set_install_id`]) rather than read at init — `app_data_dir()` needs an
//! `AppHandle`, which does not exist yet when reporting must already be live.
//! Its `set_tenant` and `report_warning` are absent rather than dead: no
//! tenant reaches this app's Rust side, and no site here fires often enough
//! for ordinary reasons to need warning level. Port them from mentorai if one
//! appears.
//!
//! Scope, by decision: error events only, no performance tracing (the web
//! side already samples that, and nothing consumes Rust traces). Rust panics
//! are covered; a hard abort or segfault is NOT — that needs minidumps and a
//! separate monitoring process, which is not part of this.

use std::borrow::Cow;
use std::fmt::Display;

use sentry::protocol::{Event, Value};
use sentry::{ClientInitGuard, ClientOptions, Level, TracesSamplingStrategy};

/// Env name for the DSN override, read at runtime first (so a dev build can
/// be aimed at a scratch project from `.env.local`), then from the value
/// `build.rs` baked in, then [`DEFAULT_DSN`].
const DSN_VAR: &str = "IBL_SENTRY_DSN_DESKTOP";

/// The project to report to when neither the runtime env nor the build names
/// one. A DSN is a public ingest key, not a secret — the web app's ships in
/// the browser bundle — so carrying it here is what makes reporting work with
/// nothing to configure.
///
/// Project 61 is SkillsAI's own. Not mentorai's 33: the two are separate
/// products, and a DSN copied from that repo would quietly file this app's
/// errors under the other one.
const DEFAULT_DSN: &str = "https://1d7cfbc7d3fe235ee478cee03e77b0de@sentry.ibl.network/61";

/// Start reporting. Returns the guard, which **must be bound to a named
/// local** for the lifetime of the process: `let _sentry = …`. A bare
/// `let _ = …` drops it immediately and every queued event dies with it.
///
/// Returns `None` — and reports nothing, at zero cost — when the machine has
/// opted out, when no DSN is configured anywhere, or in a debug build that
/// hasn't opted in. Call it AFTER the dotenv loads (so a DSN override in
/// `.env.local` is visible) and BEFORE `tauri::Builder`, so `setup()` and
/// every task spawned there is already covered.
pub fn init() -> Option<ClientInitGuard> {
    // Dev noise would drown the production signal they share an issue
    // stream with, so a debug build has to ask.
    if cfg!(debug_assertions) && std::env::var_os("IBL_SENTRY_DEBUG").is_none() {
        return None;
    }
    if opted_out() {
        return None;
    }
    let guard = sentry::init((dsn()?, options()));

    // The one filter that separates these events from the web app's in the
    // shared project. `is:unresolved runtime:tauri-rust` is the Rust view, and
    // an alert rule can scope to it.
    sentry::configure_scope(|scope| scope.set_tag("runtime", "tauri-rust"));
    Some(guard)
}

/// `ClientOptions` is `#[non_exhaustive]`, so these are assigned rather than
/// written as a struct literal. Split out from [`init`] so the privacy-relevant
/// choices are assertable without opening a client.
fn options() -> ClientOptions {
    let mut options = ClientOptions::default();
    options.release = Some(Cow::Owned(format!(
        "skillsai@{}",
        env!("IBL_APP_VERSION")
    )));
    options.environment = Some(Cow::Borrowed(if cfg!(debug_assertions) {
        "dev"
    } else {
        "production"
    }));
    // This app holds platform tokens, a minted IBLAI_API_KEY and the user's own
    // file paths. Nothing is sent on trust: `send_default_pii` off, and
    // `before_send` scrubs what slipped into a message anyway.
    options.send_default_pii = false;
    options.before_send = Some(std::sync::Arc::new(|mut event| {
        scrub_event(&mut event);
        Some(event)
    }));
    // A reported message carries the reporting thread's stack, which is what
    // makes `report("…")` locatable without a per-site line number.
    options.attach_stacktrace = true;
    // Errors only. Rust performance traces have no consumer here, and this is
    // the SDK default — pinned explicitly so a default change can't start
    // billing us for transactions nobody reads.
    options.traces_sampling_strategy = TracesSamplingStrategy::Disabled;
    options.max_breadcrumbs = 50;
    options
}

/// Attach an anonymous per-install id, so an issue can be counted in machines
/// rather than events. Called from `setup()` with the app's data directory:
/// `app_data_dir()` needs an `AppHandle`, which does not exist yet at [`init`],
/// and reporting has to be live before then to catch a panic during startup.
///
/// The id is 16 hex characters derived from random bytes — nothing in it
/// identifies anyone — minted once and then read back on every later launch.
pub fn set_install_id(data_dir: &std::path::Path) {
    let path = data_dir.join("install-id");
    let existing = std::fs::read_to_string(&path)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let id = match existing {
        Some(id) => id,
        None => {
            let minted = mint_id();
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            // A write that fails costs a stable id, not the report: the next
            // launch simply mints another. Never worth failing startup over.
            let _ = std::fs::write(&path, &minted);
            minted
        }
    };
    sentry::configure_scope(|scope| {
        scope.set_user(Some(sentry::User {
            id: Some(id),
            ..Default::default()
        }))
    });
}

/// 16 hex characters of entropy, with no `rand` dependency: hash the one thing
/// that differs between two launches on two machines.
fn mint_id() -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(std::process::id().to_le_bytes());
    hasher.update(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or_default()
            .to_le_bytes(),
    );
    hasher.update(std::env::temp_dir().to_string_lossy().as_bytes());
    hex::encode(hasher.finalize())[..16].to_string()
}

/// Report a failure, and print it exactly as the `eprintln!` it replaced did.
///
/// `context` is the grouping key, so it must be a STABLE string — one issue
/// per failure site, with the varying error text as a detail inside it.
/// Interpolating an error, a path or an id into `context` splits that one
/// issue into thousands.
pub fn report(context: &str, err: impl Display) {
    emit(context, err, Level::Error);
}

/// As [`report`], but captured at most once per process — for a site inside a
/// hot loop, where one underlying fault produces an event per iteration.
///
/// `emit_on_main` is the case this exists for: it runs per streamed token, and
/// once the main thread's event loop is gone (the app is quitting) EVERY
/// remaining emit fails. Unbounded, a single quit mid-stream would spend the
/// project's quota on hundreds of copies of one fact. Still prints every time,
/// so a terminal shows the real rate.
pub fn report_once(context: &str, err: impl Display) {
    if first_time(context) {
        emit(context, err, Level::Error);
    } else {
        eprintln!("{context}: {err}");
    }
}

/// Whether `context` has not been seen before in this process.
fn first_time(context: &str) -> bool {
    static SEEN: std::sync::Mutex<Option<std::collections::HashSet<String>>> =
        std::sync::Mutex::new(None);
    SEEN.lock()
        .unwrap_or_else(|e| e.into_inner())
        .get_or_insert_with(Default::default)
        .insert(context.to_string())
}

fn emit(context: &str, err: impl Display, level: Level) {
    let detail = err.to_string();
    eprintln!("{context}: {detail}");
    let mut event = Event {
        message: Some(context.to_string()),
        level,
        fingerprint: Cow::Owned(vec![Cow::Owned(context.to_string())]),
        ..Default::default()
    };
    event
        .extra
        .insert("error".to_string(), Value::String(detail));
    sentry::capture_event(event);
}

fn dsn() -> Option<String> {
    [
        std::env::var(DSN_VAR).ok(),
        option_env!("IBL_SENTRY_DSN_DESKTOP").map(str::to_string),
        Some(DEFAULT_DSN.to_string()),
    ]
    .into_iter()
    .flatten()
    .map(|s| s.trim().to_string())
    .find(|s| !s.is_empty())
}

/// This app persists no settings file of its own, so the env var is the whole
/// opt-out. `IBL_TELEMETRY=off` (or `0`/`false`) disables reporting.
fn opted_out() -> bool {
    std::env::var_os("IBL_TELEMETRY").is_some_and(|v| {
        v.eq_ignore_ascii_case("off") || v == "0" || v.eq_ignore_ascii_case("false")
    })
}

/// Strip from an outgoing event everything that identifies the person at the
/// keyboard, then scrub every free-text field a secret could have reached.
fn scrub_event(event: &mut Event<'static>) {
    // `sentry-contexts` fills this with the machine's hostname, which on a
    // personal Mac is usually the owner's name ("sones-macbook-pro.local").
    event.server_name = None;

    if let Some(message) = event.message.take() {
        event.message = Some(scrub(&message));
    }
    for exception in &mut event.exception.values {
        if let Some(value) = exception.value.take() {
            exception.value = Some(scrub(&value));
        }
    }
    for crumb in &mut event.breadcrumbs.values {
        if let Some(message) = crumb.message.take() {
            crumb.message = Some(scrub(&message));
        }
    }
    for value in event.extra.values_mut() {
        if let Value::String(s) = value {
            *s = scrub(s);
        }
    }
}

/// Redact the home directory and anything secret-shaped out of one string.
fn scrub(text: &str) -> String {
    redact_secrets(&redact_home(text, home_dir().as_deref()))
}

fn home_dir() -> Option<String> {
    for var in ["HOME", "USERPROFILE"] {
        if let Ok(v) = std::env::var(var) {
            let v = v.trim_end_matches(['/', '\\']).to_string();
            if !v.is_empty() {
                return Some(v);
            }
        }
    }
    None
}

/// `/Users/sone/.local/share/iblai` → `~/.local/share/iblai`. The path shape
/// is what makes a filesystem error diagnosable; the username is not, and it
/// is the one piece of identity that appears in nearly every path we log.
fn redact_home(text: &str, home: Option<&str>) -> String {
    match home.map(|h| h.trim_end_matches(['/', '\\'])) {
        Some(home) if !home.is_empty() => text.replace(home, "~"),
        _ => text.to_string(),
    }
}

/// A key whose value must never leave the machine. Substring matching, so
/// `IBLAI_API_KEY`, `access_token` and `Authorization` all land; it
/// over-redacts (`monkey=`) rather than under-redacts, by design.
fn is_sensitive_key(key: &str) -> bool {
    const WORDS: [&str; 8] = [
        "token",
        "key",
        "secret",
        "password",
        "passwd",
        "authorization",
        "credential",
        "cookie",
    ];
    let key = key.to_ascii_lowercase();
    WORDS.iter().any(|w| key.contains(w))
}

const REDACTED: &str = "[redacted]";

/// Redact secret VALUES while leaving the surrounding text readable, in the
/// three shapes secrets actually appear in here: `KEY=value` (env vars and
/// query strings), `"key": "value"` (JSON bodies) and `Bearer <token>`.
///
/// Only those three. An earlier, looser rule also redacted after any `:`,
/// which ate the real error out of `could not persist IBLAI_API_KEY: <io
/// error>` — the exact text the report exists to carry.
fn redact_secrets(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut out = String::with_capacity(text.len());
    let mut i = 0;
    while i < chars.len() {
        if let Some(next) = redact_bearer(&chars, i, &mut out) {
            i = next;
            continue;
        }
        if chars[i] == '"' {
            if let Some(next) = redact_json_pair(&chars, i, &mut out) {
                i = next;
                continue;
            }
        }
        if chars[i] == '=' && is_sensitive_key(&key_before(&chars, i)) {
            // Into a scratch first: a `KEY=` with no value must leave the text
            // untouched, and a half-written `=` cannot be taken back out.
            let mut redacted = String::new();
            if let Some(next) = redact_value(&chars, i + 1, &mut redacted) {
                out.push('=');
                out.push_str(&redacted);
                i = next;
                continue;
            }
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}

/// The bare key token immediately left of `at`: `IBLAI_API_KEY` out of
/// `env IBLAI_API_KEY=…`, `token` out of `…?token=…`.
fn key_before(chars: &[char], at: usize) -> String {
    let mut start = at;
    while start > 0 {
        let c = chars[start - 1];
        if c.is_alphanumeric() || c == '_' || c == '-' || c == '.' {
            start -= 1;
        } else {
            break;
        }
    }
    chars[start..at].iter().collect()
}

/// `"key": "value"` → `"key": "[redacted]"`. Returns the index past the
/// rewritten pair, or `None` when this is not a sensitive quoted pair.
fn redact_json_pair(chars: &[char], at: usize, out: &mut String) -> Option<usize> {
    let (after_key, key) = read_quoted(chars, at)?;
    if !is_sensitive_key(&key) {
        return None;
    }
    let mut i = skip_spaces(chars, after_key);
    if chars.get(i) != Some(&':') {
        return None;
    }
    i = skip_spaces(chars, i + 1);
    let (after_value, _) = read_quoted(chars, i)?;
    out.extend(&chars[at..i]);
    out.push('"');
    out.push_str(REDACTED);
    out.push('"');
    Some(after_value)
}

/// `Bearer <token>` → `Bearer [redacted]`, case-insensitive.
///
/// Redacts the next word on sight rather than checking it looks like a
/// credential: a length or charset test would be the one rule here that can
/// fail by leaking, and no log line in this app discusses bearers in prose.
fn redact_bearer(chars: &[char], at: usize, out: &mut String) -> Option<usize> {
    const BEARER: &str = "bearer ";
    if at > 0 && (chars[at - 1].is_alphanumeric() || chars[at - 1] == '_') {
        return None;
    }
    let word: String = chars
        .get(at..at + BEARER.len())?
        .iter()
        .collect::<String>()
        .to_ascii_lowercase();
    if word != BEARER {
        return None;
    }
    let mut redacted = String::new();
    let next = redact_value(chars, at + BEARER.len(), &mut redacted)?;
    out.extend(&chars[at..at + BEARER.len()]);
    out.push_str(&redacted);
    Some(next)
}

/// Replace the value starting at `at` with [`REDACTED`], quoted or bare.
/// `None` when there is no value there to redact.
fn redact_value(chars: &[char], at: usize, out: &mut String) -> Option<usize> {
    if let Some(quote) = chars.get(at).copied().filter(|c| *c == '"' || *c == '\'') {
        let (end, _) = read_delimited(chars, at, quote)?;
        out.push(quote);
        out.push_str(REDACTED);
        out.push(quote);
        return Some(end);
    }
    let mut end = at;
    while end < chars.len() && !is_value_terminator(chars[end]) {
        end += 1;
    }
    if end == at {
        return None;
    }
    out.push_str(REDACTED);
    Some(end)
}

fn is_value_terminator(c: char) -> bool {
    c.is_whitespace() || matches!(c, '&' | '"' | '\'' | ',' | ';' | '}' | ')' | ']')
}

fn read_quoted(chars: &[char], at: usize) -> Option<(usize, String)> {
    (chars.get(at) == Some(&'"')).then(|| read_delimited(chars, at, '"'))?
}

/// The string delimited by `quote` starting at `at`, as (index past the
/// closing quote, contents). `None` when unterminated.
fn read_delimited(chars: &[char], at: usize, quote: char) -> Option<(usize, String)> {
    let mut i = at + 1;
    let mut value = String::new();
    while i < chars.len() {
        match chars[i] {
            '\\' if i + 1 < chars.len() => {
                value.push(chars[i]);
                value.push(chars[i + 1]);
                i += 2;
            }
            c if c == quote => return Some((i + 1, value)),
            c => {
                value.push(c);
                i += 1;
            }
        }
    }
    None
}

fn skip_spaces(chars: &[char], at: usize) -> usize {
    let mut i = at;
    while chars.get(i).is_some_and(|c| *c == ' ') {
        i += 1;
    }
    i
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A debug build must stay silent unless it asks — the state every
    /// developer and every `cargo test` run is in. Without this the suite
    /// would post on every run, and since the DSN now defaults to the web
    /// app's, it would post into the project the whole product reports to.
    #[test]
    fn a_debug_build_does_not_report_unless_it_asks() {
        let _g = env_lock();
        let restore = Restore::of(&["IBL_SENTRY_DEBUG"]);
        std::env::remove_var("IBL_SENTRY_DEBUG");
        assert!(cfg!(debug_assertions), "tests only ever run in debug");
        assert!(init().is_none());
        drop(restore);
    }

    /// The override has to actually override, and a blank or whitespace value
    /// (an env var set to nothing by a shell script) must fall through rather
    /// than opening a client on an empty DSN.
    #[test]
    fn the_dsn_override_wins_and_a_blank_one_falls_through() {
        let _g = env_lock();
        let restore = Restore::of(&[DSN_VAR]);
        // `option_env!` only takes a literal, so the compile-time half of
        // `dsn()` cannot reference DSN_VAR. Pin them equal: drift would leave
        // the runtime override reading a name the build never bakes.
        assert_eq!(DSN_VAR, "IBL_SENTRY_DSN_DESKTOP");

        std::env::set_var(DSN_VAR, "https://abc@sentry.example/9");
        assert_eq!(dsn().as_deref(), Some("https://abc@sentry.example/9"));
        for blank in ["", "   "] {
            std::env::set_var(DSN_VAR, blank);
            assert_eq!(
                dsn().as_deref(),
                Some(DEFAULT_DSN),
                "a blank override is not a DSN; it falls through to the default"
            );
        }
        drop(restore);
    }

    /// The release tag is what separates these events from the web app's in a
    /// shared project; the `runtime` tag set in `init` is the other half.
    /// Losing either buries them in the web app's console-error stream.
    #[test]
    fn rust_events_stay_findable_in_the_shared_project() {
        let release = options().release.expect("a release tag");
        assert!(
            release.starts_with("skillsai@"),
            "the release must not collide with the web app's: {release}"
        );
        // The project id is the half that silently goes wrong: mentorai's
        // telemetry.rs is this file's sibling, and a DSN lifted from it would
        // file every SkillsAI error under that product with nothing failing.
        assert!(
            DEFAULT_DSN.ends_with("/61"),
            "the default DSN must name SkillsAI's own project: {DEFAULT_DSN}"
        );
        assert!(DEFAULT_DSN.starts_with("https://"));
    }

    #[test]
    fn the_env_var_opts_a_machine_out() {
        let _g = env_lock();
        let restore = Restore::of(&["IBL_TELEMETRY"]);
        for value in ["off", "OFF", "0", "false"] {
            std::env::set_var("IBL_TELEMETRY", value);
            assert!(opted_out(), "IBL_TELEMETRY={value} must disable reporting");
        }
        std::env::set_var("IBL_TELEMETRY", "on");
        assert!(!opted_out());
        drop(restore);
    }

    #[test]
    fn the_users_name_never_leaves_in_a_path() {
        assert_eq!(
            redact_home(
                "failed writing /Users/sone/.local/share/iblai/settings.json",
                Some("/Users/sone")
            ),
            "failed writing ~/.local/share/iblai/settings.json"
        );
        assert_eq!(
            redact_home(r"C:\Users\sone\AppData", Some(r"C:\Users\sone\")),
            r"~\AppData",
            "a trailing separator on HOME must not defeat the match"
        );
        assert_eq!(redact_home("no home known", None), "no home known");
    }

    #[test]
    fn secret_values_are_redacted_in_every_shape_we_log() {
        assert_eq!(
            redact_secrets("spawning with IBLAI_API_KEY=sk-live-abc123 and PATH=/usr/bin"),
            "spawning with IBLAI_API_KEY=[redacted] and PATH=/usr/bin",
            "an env dump keeps the harmless variables readable"
        );
        assert_eq!(
            redact_secrets("GET /v1/chat?tenant=main&token=eyJhbGciOi.abc&page=2"),
            "GET /v1/chat?tenant=main&token=[redacted]&page=2"
        );
        assert_eq!(
            redact_secrets(r#"{"access_token": "abc.def", "model": "gpt-5"}"#),
            r#"{"access_token": "[redacted]", "model": "gpt-5"}"#
        );
        assert_eq!(
            redact_secrets("authorization: Bearer eyJhbGciOiJIUzI1NiJ9.x"),
            "authorization: Bearer [redacted]"
        );
    }

    /// The whole point of a report is the error text inside it. A scrubber
    /// that eats the error because the CONTEXT names a key is a scrubber
    /// that makes every report useless.
    #[test]
    fn scrubbing_keeps_the_error_the_report_exists_to_carry() {
        assert_eq!(
            redact_secrets(
                "[opencode-proxy] could not persist IBLAI_API_KEY: No space left on device"
            ),
            "[opencode-proxy] could not persist IBLAI_API_KEY: No space left on device"
        );
        assert_eq!(
            redact_secrets("[AppUpdate] check failed: error sending request"),
            "[AppUpdate] check failed: error sending request"
        );
        assert_eq!(
            redact_secrets("a bare = sign and an empty KEY= stay as they are"),
            "a bare = sign and an empty KEY= stay as they are"
        );
        // Over-redaction, on purpose: prose about a "bearer" loses the next
        // word. Nothing here logs such prose, and the opposite error leaks a
        // credential — so the rule stays blunt. Same stance as
        // `is_sensitive_key` taking `monkey=`.
        assert_eq!(
            redact_secrets("the word bearer alone is not a header"),
            "the word bearer [redacted] is not a header"
        );
    }

    /// The pure helpers above are only worth anything if `before_send`
    /// actually reaches every free-text field of a real event. A panic's text
    /// lands in `exception[].value`, a report's in `message` + `extra`, and
    /// `sentry-contexts` fills `server_name` with the machine's hostname —
    /// which on a personal Mac is usually the owner's name.
    #[test]
    fn the_outgoing_event_is_scrubbed_in_every_field() {
        let mut event = Event {
            message: Some("writing /Users/sone/x failed".to_string()),
            server_name: Some(Cow::Borrowed("sones-macbook-pro.local")),
            ..Default::default()
        };
        event.exception.values.push(sentry::protocol::Exception {
            ty: "panic".to_string(),
            value: Some("spawn failed: IBLAI_API_KEY=sk-live-abc".to_string()),
            ..Default::default()
        });
        event.breadcrumbs.values.push(sentry::protocol::Breadcrumb {
            message: Some("GET /v1/chat?token=eyJhbGciOi.abc".to_string()),
            ..Default::default()
        });
        event.extra.insert(
            "error".to_string(),
            Value::String(r#"{"access_token": "abc.def"}"#.to_string()),
        );

        let home = home_dir();
        scrub_event(&mut event);

        assert_eq!(event.server_name, None, "the hostname names the owner");
        if home.as_deref() == Some("/Users/sone") {
            assert_eq!(event.message.as_deref(), Some("writing ~/x failed"));
        }
        assert_eq!(
            event.exception.values[0].value.as_deref(),
            Some("spawn failed: IBLAI_API_KEY=[redacted]")
        );
        assert_eq!(
            event.breadcrumbs.values[0].message.as_deref(),
            Some("GET /v1/chat?token=[redacted]")
        );
        assert_eq!(
            event.extra["error"],
            Value::String(r#"{"access_token": "[redacted]"}"#.to_string())
        );
    }

    /// One fault in a per-token loop must cost one event, not one per token.
    #[test]
    fn report_once_captures_only_the_first_of_its_kind() {
        let context = "[test] a repeated failure in a hot loop";
        assert!(first_time(context), "the first call is the one that reports");
        for _ in 0..500 {
            assert!(!first_time(context), "every later call is print-only");
        }
        assert!(first_time("[test] a different failure"));
    }

    /// Reporting must survive being called before (or without) `init`, since
    /// the opt-out and the no-DSN paths leave no client at all and the call
    /// sites are spread through code that knows nothing about either.
    #[test]
    fn reporting_without_a_client_is_a_no_op() {
        report("[test] a failure with no client", "boom");
        report_once("[test] a once-only failure with no client", "boom");
    }

    /// Sentry groups by release, so the baked tag has to be the version the
    /// app actually ships as — the one in `tauri.conf.json`, on the DMG and on
    /// the updater feed — not the 0.1.0 `Cargo.toml` has carried since the
    /// start. Tagged 0.1.0, every issue ever filed would look like one build.
    ///
    /// Asserted here rather than in `build.rs`, whose `mod tests` cargo never
    /// builds: a test that cannot run pins nothing.
    #[test]
    fn the_release_tag_is_the_shipped_version() {
        let baked = env!("IBL_APP_VERSION");
        assert_ne!(baked, env!("CARGO_PKG_VERSION"));

        let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let conf: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(manifest.join("tauri.conf.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(
            conf["version"].as_str(),
            Some(baked),
            "build.rs must bake tauri.conf.json's version, not another source"
        );
        assert_eq!(
            options().release.as_deref(),
            Some(format!("skillsai@{baked}").as_str())
        );
    }

    /// The privacy-relevant options are the ones a refactor can silently
    /// flip — and each costs something real if it does: PII attached to every
    /// event, an unscrubbed message, or a transaction bill for traces nobody
    /// reads.
    #[test]
    fn the_privacy_and_cost_options_stay_pinned() {
        let options = options();
        assert!(!options.send_default_pii);
        assert!(options.before_send.is_some(), "nothing goes out unscrubbed");
        assert!(matches!(
            options.traces_sampling_strategy,
            TracesSamplingStrategy::Disabled
        ));
    }

    /// `run()` is the one entry point — `main.rs` is a shim that calls it, so
    /// everything, desktop and mobile, starts here. Pin that reporting starts
    /// in it (and that the guard is BOUND), and pin `main.rs` staying a shim:
    /// a second entry point that forgot this call would report nothing, and
    /// nothing else would notice.
    #[test]
    fn the_entry_point_starts_reporting() {
        let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let lib = std::fs::read_to_string(manifest.join("src/lib.rs")).unwrap();
        assert!(
            lib.contains("mod telemetry;"),
            "lib.rs must declare the telemetry module"
        );
        assert!(
            lib.contains("let _sentry = telemetry::init();"),
            "run() must start reporting, and must BIND the guard — a bare \
             `let _ =` drops it and discards every queued event"
        );
        let main = std::fs::read_to_string(manifest.join("src/main.rs")).unwrap();
        assert!(
            main.contains("skills_ai_lib::run();"),
            "main.rs must stay a shim over run(); a second entry point would \
             need its own telemetry::init()"
        );
    }

    fn env_lock() -> std::sync::MutexGuard<'static, ()> {
        static L: std::sync::Mutex<()> = std::sync::Mutex::new(());
        L.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Puts back whatever the process-global env held, so these tests can't
    /// leak a DSN or an opt-out into another test's view of the world.
    struct Restore(Vec<(&'static str, Option<std::ffi::OsString>)>);

    impl Restore {
        fn of(vars: &[&'static str]) -> Self {
            Self(vars.iter().map(|v| (*v, std::env::var_os(v))).collect())
        }
    }

    impl Drop for Restore {
        fn drop(&mut self) {
            for (var, value) in &self.0 {
                match value {
                    Some(v) => std::env::set_var(var, v),
                    None => std::env::remove_var(var),
                }
            }
        }
    }
}
