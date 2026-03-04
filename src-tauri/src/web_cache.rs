use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

const CACHE_DIR: &str = "web_cache";
const CACHE_INDEX_FILE: &str = "index.json";
const CACHE_MAX_AGE_SECS: u64 = 7 * 24 * 60 * 60; // 7 days

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedEntry {
    pub url: String,
    pub status: u16,
    pub content_type: String,
    pub headers: HashMap<String, String>,
    pub body_hash: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheIndex {
    pub version: u32,
    pub entries: HashMap<String, CachedEntry>,
}

pub struct WebCache {
    client: Client,
    cache_dir: PathBuf,
    index: Arc<RwLock<CacheIndex>>,
    is_online: Arc<RwLock<bool>>,
}

impl WebCache {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let cache_dir = app_data_dir.join(CACHE_DIR);
        fs::create_dir_all(&cache_dir).ok();

        let index = Self::load_index(&cache_dir);

        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap_or_default(),
            cache_dir,
            index: Arc::new(RwLock::new(index)),
            is_online: Arc::new(RwLock::new(true)),
        }
    }

    fn load_index(cache_dir: &PathBuf) -> CacheIndex {
        let index_path = cache_dir.join(CACHE_INDEX_FILE);
        if let Ok(data) = fs::read_to_string(&index_path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            CacheIndex {
                version: 1,
                entries: HashMap::new(),
            }
        }
    }

    async fn save_index(&self) {
        let index = self.index.read().await;
        let index_path = self.cache_dir.join(CACHE_INDEX_FILE);
        if let Ok(data) = serde_json::to_string_pretty(&*index) {
            fs::write(index_path, data).ok();
        }
    }

    fn url_to_hash(url: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(url.as_bytes());
        hex::encode(hasher.finalize())
    }

    pub async fn set_online(&self, online: bool) {
        let mut is_online = self.is_online.write().await;
        *is_online = online;
    }

    pub async fn is_online(&self) -> bool {
        *self.is_online.read().await
    }

    pub async fn fetch(&self, url: &str) -> Result<CacheResponse, String> {
        let is_online = self.is_online().await;

        if is_online {
            // Try network first
            match self.fetch_from_network(url).await {
                Ok(response) => {
                    // Cache successful responses
                    if response.status < 400 {
                        self.store_in_cache(url, &response).await;
                    }
                    return Ok(response);
                }
                Err(e) => {
                    println!("[WebCache] Network fetch failed: {}, trying cache", e);
                    // Fall through to cache
                }
            }
        }

        // Try cache
        if let Some(cached) = self.get_from_cache(url).await {
            println!("[WebCache] Serving from cache: {}", url);
            return Ok(cached);
        }

        Err(format!(
            "Failed to fetch {} - offline and not in cache",
            url
        ))
    }

    async fn fetch_from_network(&self, url: &str) -> Result<CacheResponse, String> {
        println!("[WebCache] Fetching from network: {}", url);

        let response = self
            .client
            .get(url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = response.status().as_u16();
        let mut headers = HashMap::new();
        let mut content_type = "application/octet-stream".to_string();

        for (key, value) in response.headers() {
            if let Ok(v) = value.to_str() {
                if key.as_str().eq_ignore_ascii_case("content-type") {
                    content_type = v.to_string();
                }
                headers.insert(key.to_string(), v.to_string());
            }
        }

        let body = response.bytes().await.map_err(|e| e.to_string())?;

        Ok(CacheResponse {
            status,
            content_type,
            headers,
            body: body.to_vec(),
        })
    }

    async fn store_in_cache(&self, url: &str, response: &CacheResponse) {
        let hash = Self::url_to_hash(url);
        let body_path = self.cache_dir.join(&hash);

        // Save body to file
        if fs::write(&body_path, &response.body).is_err() {
            return;
        }

        let entry = CachedEntry {
            url: url.to_string(),
            status: response.status,
            content_type: response.content_type.clone(),
            headers: response.headers.clone(),
            body_hash: hash,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        let mut index = self.index.write().await;
        index.entries.insert(url.to_string(), entry);
        drop(index);

        self.save_index().await;
    }

    async fn get_from_cache(&self, url: &str) -> Option<CacheResponse> {
        let index = self.index.read().await;
        let entry = index.entries.get(url)?;

        // Check if cache is too old
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if now - entry.timestamp > CACHE_MAX_AGE_SECS {
            return None;
        }

        let body_path = self.cache_dir.join(&entry.body_hash);
        let body = fs::read(&body_path).ok()?;

        Some(CacheResponse {
            status: entry.status,
            content_type: entry.content_type.clone(),
            headers: entry.headers.clone(),
            body,
        })
    }

    /// Store a response in cache (public API for direct caching)
    pub async fn store_response(&self, url: &str, response: &CacheResponse) {
        self.store_in_cache(url, response).await;
    }

    /// Get a cached response directly (public API)
    pub async fn get_cached(&self, url: &str) -> Option<CacheResponse> {
        self.get_from_cache(url).await
    }

    /// Get all cached URLs (for pattern matching)
    pub async fn get_cached_urls(&self) -> Vec<String> {
        let index = self.index.read().await;
        index.entries.keys().cloned().collect()
    }

    pub async fn clear(&self) -> Result<(), String> {
        {
            let mut index = self.index.write().await;
            index.entries.clear();
        }
        self.save_index().await;

        // Remove all files except index
        if let Ok(entries) = fs::read_dir(&self.cache_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file()
                    && path
                        .file_name()
                        .map(|n| n != CACHE_INDEX_FILE)
                        .unwrap_or(false)
                {
                    fs::remove_file(path).ok();
                }
            }
        }

        Ok(())
    }

    pub async fn get_stats(&self) -> CacheStats {
        let index = self.index.read().await;
        let count = index.entries.len();

        let mut total_size: u64 = 0;
        for entry in index.entries.values() {
            let path = self.cache_dir.join(&entry.body_hash);
            if let Ok(meta) = fs::metadata(&path) {
                total_size += meta.len();
            }
        }

        CacheStats {
            entry_count: count,
            total_size_bytes: total_size,
        }
    }

    /// Pre-cache a URL and all its linked assets (JS, CSS)
    pub async fn precache_with_assets(&self, base_url: &str) -> Result<PrecacheResult, String> {
        let mut cached_urls = Vec::new();
        let mut failed_urls = Vec::new();

        // Extract the origin from the URL for caching the root
        let origin = if let Some(idx) = base_url.find("://") {
            let after_protocol = &base_url[idx + 3..];
            if let Some(path_start) = after_protocol.find('/') {
                &base_url[..idx + 3 + path_start]
            } else {
                base_url
            }
        } else {
            base_url
        };

        println!("[WebCache] Precaching with origin: {}", origin);

        // First, cache the root URL (needed for SPA routing)
        if origin != base_url {
            match self.fetch(origin).await {
                Ok(_) => {
                    println!("[WebCache] Cached root: {}", origin);
                    cached_urls.push(origin.to_string());
                }
                Err(e) => {
                    println!("[WebCache] Failed to cache root: {}", e);
                }
            }
        }

        // Then fetch the specific page
        let response = self.fetch(base_url).await?;
        cached_urls.push(base_url.to_string());

        // Parse HTML to find asset URLs
        let html = String::from_utf8_lossy(&response.body);
        let asset_urls = Self::extract_asset_urls(&html, origin);

        println!(
            "[WebCache] Found {} assets to pre-cache from {}",
            asset_urls.len(),
            base_url
        );

        // Fetch each asset
        for url in asset_urls {
            match self.fetch(&url).await {
                Ok(_) => {
                    println!("[WebCache] Cached: {}", url);
                    cached_urls.push(url);
                }
                Err(e) => {
                    println!("[WebCache] Failed to cache {}: {}", url, e);
                    failed_urls.push(url);
                }
            }
        }

        Ok(PrecacheResult {
            cached_count: cached_urls.len(),
            failed_count: failed_urls.len(),
            cached_urls,
        })
    }

    /// Extract asset URLs from HTML
    fn extract_asset_urls(html: &str, base_url: &str) -> Vec<String> {
        let mut urls = Vec::new();

        // Simple regex-like parsing for src="/_next/..." and href="/_next/..."
        // We'll use a basic approach since we don't have regex crate
        let patterns = [
            (r#"src="/_next/"#, r#"""#),
            (r#"href="/_next/"#, r#"""#),
            (r#"src='/_next/"#, r#"'"#),
            (r#"href='/_next/"#, r#"'"#),
        ];

        for (start_pattern, end_char) in patterns {
            let mut search_from = 0;
            while let Some(start_idx) = html[search_from..].find(start_pattern) {
                let actual_start = search_from + start_idx + start_pattern.len() - 7; // -7 to include /_next/
                if let Some(end_idx) = html[actual_start..].find(end_char) {
                    let path = &html[actual_start..actual_start + end_idx];
                    let full_url = format!("{}{}", base_url, path);
                    if !urls.contains(&full_url) {
                        urls.push(full_url);
                    }
                }
                search_from = search_from + start_idx + 1;
            }
        }

        urls
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrecacheResult {
    pub cached_count: usize,
    pub failed_count: usize,
    pub cached_urls: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct CacheResponse {
    pub status: u16,
    pub content_type: String,
    pub headers: HashMap<String, String>,
    pub body: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub entry_count: usize,
    pub total_size_bytes: u64,
}
