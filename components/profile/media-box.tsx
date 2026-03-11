"use client";

import { useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  File,
} from "lucide-react";
import { getUserName } from "@/utils/helpers";
// @ts-ignore
import { useGetUserResumeQuery } from "@iblai/iblai-js/data-layer";
import { getTenant } from "@/utils/helpers";
import { SkeletonMultiplier } from "../skeleton-multiplier";
import { UploadedFile } from "@/types/career";
import { DefaultEmptyBox } from "../default-empty-box";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateUserResumeMutation } from "@/services/career";
import _ from "lodash";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { useTenantMetadata } from "@iblai/iblai-js/web-utils";

/**
 * Extrait le nom du fichier à partir d'un chemin d'URL
 * @param path - Le chemin complet du fichier
 * @returns Le nom du fichier
 */
const getFileNameFromPath = (path: string): string => {
  return path.split("/").pop() || path || "";
};

/**
 * Détermine l'icône appropriée en fonction de l'extension du fichier
 * @param fileName - Le nom du fichier
 * @returns Le composant d'icône Lucide approprié
 */
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // Images
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
    return <FileImage className="h-4 w-4" />;
  }
  // Documents
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) {
    return <FileText className="h-4 w-4" />;
  }
  // Vidéos
  if (["mp4", "webm", "avi", "mov"].includes(extension)) {
    return <FileVideo className="h-4 w-4" />;
  }
  // Audio
  if (["mp3", "wav", "ogg", "flac"].includes(extension)) {
    return <FileAudio className="h-4 w-4" />;
  }
  // Archives
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return <FileArchive className="h-4 w-4" />;
  }
  // Code
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "json",
      "py",
      "java",
      "c",
      "cpp",
    ].includes(extension)
  ) {
    return <FileCode className="h-4 w-4" />;
  }
  // Par défaut
  return <File className="h-4 w-4" />;
};

const MediaSkeleton = () => (
  <div className="flex items-center border border-gray-200 rounded-md p-2.5 bg-white animate-pulse">
    <div className="mr-2 h-4 w-4 bg-gray-200 rounded-full"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  </div>
);

export const MediaBox = () => {
  const { data, isLoading, isError, refetch } = useGetUserResumeQuery([
    {
      org: getTenant(),
      username: getUserName(),
    },
  ]);
  const { metadataLoaded, isSkillsResumeFeatureHidden } =
    useTenantMetadata({ org: getTenant() });
  const [createUserResume, { isError: isUploadError }] =
    useCreateUserResumeMutation();
  const [file, setFile] = useState<File | undefined>(undefined);
  const form = useForm({
    defaultValues: {
      link_1: "",
      isResume: false,
      file: "",
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("user", getUserName());
      formData.append("platform", getTenant());
      switch (activeUploadTab) {
        case LINK_TAB:
          try {
            const totalLinks = (data.links || []).length;
            (data.links || []).forEach(
              (link: Partial<UploadedFile>, index: number) => {
                formData.append(
                  "link_" + (totalLinks + 1 - index),
                  link?.url || ""
                );
              }
            );
            formData.append("link_1", value.link_1);
            await createUserResume({
              username: getUserName(),
              platform_key: getTenant(),
              resume: formData,
            });
            if (isUploadError) {
              throw new Error("Error uploading media");
            }
            refetch();
            toast.success("Media uploaded successfully");
            form.reset();
          } catch (error) {
            toast.error("Error uploading media");
          }
          break;
        default:
          //case FILE
          if (!file) {
            toast.error("Please upload a file.");
            return;
          }
          try {
            if (value.isResume) {
              formData.append("resume", file);
            } else {
              formData.append("additional_files", file);
              formData.append("file_type_portfolio_sample.pdf", "portfolio");
            }
            await createUserResume({
              username: getUserName(),
              platform_key: getTenant(),
              resume: formData,
              method: "POST",
            });
            if (isUploadError) {
              throw new Error("Error uploading media");
            }
            refetch();
            setFile(undefined);
            setUploadedFileIsPDF(false);
            toast.success("Media uploaded successfully");
            form.reset();
          } catch (error) {
            toast.error("Error uploading media");
          }
          break;
      }
    },
  });
  const FILE_TAB = "file";
  const LINK_TAB = "link";
  const [activeUploadTab, setActiveUploadTab] = useState(FILE_TAB);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileIsPDF, setUploadedFileIsPDF] = useState<boolean>(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (_.isEmpty(event.target.files)) {
      return;
    }
    const file = event.target.files?.[0];
    setFile(undefined);
    if (!file) {
      return;
    }
    if (file.size > 26214400) {
      // 25MB in bytes
      toast.error("File size should be less than 25MB");
      return;
    }
    if (file.type === "application/pdf") {
      if (metadataLoaded && !isSkillsResumeFeatureHidden()) {
        setUploadedFileIsPDF(true);
      }
    }
    setFile(file);
  };

  useEffect(() => {
    if (Array.isArray(data?.files)) {
      const medias = [
        ...(data.files || []),
        ...(data.links?.map((link: Partial<UploadedFile>) => ({
          name: link.url,
          url: link.url,
          type: "link",
        })) || []),
      ];
      setUploadedMedia(medias);
    }
  }, [data]);

  const handleSubmit = () => {
    if (!form.state.isFormValid) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.state.isSubmitting) {
      return;
    }
    form.handleSubmit();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Subscribe
          selector={(state) => [state.isSubmitting]}
        >
          {([isSubmitting]) => (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Upload Media Section */}
              <div className="w-full md:w-1/3">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Upload Media
                </h2>

                {/* Upload Tabs */}
                <div className="flex mb-4">
                  <button
                    className={`flex-1 py-2 text-center font-medium transition-colors ${
                      activeUploadTab === FILE_TAB
                        ? "bg-white border-t border-l border-r border-amber-200 text-amber-600"
                        : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveUploadTab(FILE_TAB)}
                  >
                    File Upload
                  </button>
                  <button
                    className={`flex-1 py-2 text-center font-medium transition-colors ${
                      activeUploadTab === LINK_TAB
                        ? "bg-white border-t border-l border-r border-amber-200 text-amber-600"
                        : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveUploadTab(LINK_TAB)}
                  >
                    Link Upload
                  </button>
                </div>

                {/* Upload Area */}
                {activeUploadTab === FILE_TAB ? (
                  <>
                    <div
                      onClick={() => {
                        inputRef.current?.click();
                      }}
                      className="border-2 border-dashed border-amber-200 rounded-md p-8 flex flex-col items-center justify-center text-center bg-amber-50/30 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <Upload className="h-10 w-10 text-amber-500 mb-4" />
                      <input
                        ref={inputRef}
                        id="file-input"
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <p className="text-gray-700 mb-1 font-medium">
                        Drag and drop your file here
                      </p>
                      <p className="text-gray-500 text-sm">(Up to 25MB)</p>
                    </div>
                    {file && (
                      <p className="text-gray-500 text-sm mt-4">
                        Selected file : {file.name}
                      </p>
                    )}
                    {uploadedFileIsPDF && (
                      <form.Field
                        name="isResume"
                      >
                        {(field) => (
                          <div className="flex items-center gap-3 mt-4">
                            <Checkbox
                              id={field.name}
                              checked={field.state.value}
                              onCheckedChange={(checked) =>
                                field.handleChange(!!checked)
                              }
                            />
                            <Label htmlFor={field.name}>This is a resume</Label>
                          </div>
                        )}
                      </form.Field>
                    )}
                  </>
                ) : (
                  <div className="border-2 border-amber-200 rounded-md p-6 bg-white">
                    <form.Field
                      name="link_1"
                      validators={{
                        onChange: ({ value }) =>
                          /* activeUploadTab === LINK_TAB &&  */ !value && //valid url
                          "Link is required",
                      }}
                    >
                      {(field) => (
                        <div className="mb-4">
                          <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Enter URL
                          </label>
                          <input
                            id={field.name}
                            type="url"
                            placeholder="https://example.com/resource"
                            className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-700"
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
                              {field.state.meta.errors.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <p className="text-xs text-gray-500 mb-2">
                      Add links to websites, documents, videos, or other online
                      resources
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  type="submit"
                  disabled={!!isSubmitting}
                  onClick={handleSubmit}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-gray-700 to-amber-500 text-white rounded-md hover:opacity-90 transition-opacity font-medium"
                >
                  {isSubmitting
                    ? "Uploading..."
                    : activeUploadTab === FILE_TAB
                    ? "Upload File"
                    : "Add Link"}
                </button>
              </div>

              {/* Uploaded Media Section */}
              <div className="w-full md:w-2/3">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Uploaded Media
                </h2>
                {((!isLoading && isError) ||
                    (!isLoading && !isError && !uploadedMedia.length)) && (
                    <DefaultEmptyBox
                      message="No media found."
                      className="w-full"
                    />
                  )}
                {/* Media Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {isLoading && (
                    <SkeletonMultiplier
                      Skeleton={MediaSkeleton}
                      multiplier={12}
                    />
                  )}
                  {!isLoading &&
                    !isError &&
                    uploadedMedia.length &&
                    uploadedMedia.map((media: UploadedFile, index: number) => {
                      const fileName = getFileNameFromPath(media.name);
                      return (
                        <Link
                          key={`uploaded-media-${index}`}
                          href={media.url}
                          target="_blank"
                          title={fileName}
                          className="flex items-center border border-gray-200 rounded-md p-2.5 bg-white hover:bg-amber-50 transition-colors cursor-pointer text-sm truncate shadow-sm hover:shadow-md"
                        >
                          <span className="mr-2 text-amber-500">
                            {getFileIcon(fileName)}
                          </span>
                          <span className="truncate text-gray-700">
                            {fileName}
                          </span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
};
