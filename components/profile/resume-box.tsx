'use client';

import { UploadedFile } from '@/types/career';
import { getTenant, getUserName } from '@/utils/helpers';
// @ts-ignore
import { useGetUserResumeQuery } from '@iblai/iblai-js/data-layer';
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DefaultEmptyBox } from '../default-empty-box';
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (error) {
  console.log('Failed to set pdfjs worker source:', error);
}

const ResumeBoxSkeleton = () => {
  return <div className="w-full h-[200px] bg-gray-200 animate-pulse rounded-lg" />;
};
export const ResumeBox = () => {
  const { data, isLoading, isError } = useGetUserResumeQuery([
    {
      org: getTenant(),
      username: getUserName(),
    },
  ]);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [resumeLoadError, setResumeLoadError] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0); // For zoom control
  const [rotation, setRotation] = useState(0); // For rotation control

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = () => {
    setResumeLoadError(true);
  };

  // Handlers for controls
  const goToPrevPage = () => setPageNumber(pageNumber - 1);
  const goToNextPage = () => setPageNumber(pageNumber + 1);
  const zoomIn = () => setScale(scale + 0.2);
  const zoomOut = () => setScale(scale > 0.4 ? scale - 0.2 : scale);
  const rotateLeft = () => setRotation(rotation - 90);
  const rotateRight = () => setRotation(rotation + 90);

  useEffect(() => {
    if (Array.isArray(data?.files)) {
      setResumeUrl(data?.files.find((file: UploadedFile) => file.type === 'resume')?.url);
    }
  }, [data]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Resume</h2>
      {isLoading && <ResumeBoxSkeleton />}
      {((!isLoading && isError) || (!isLoading && !isError && !resumeUrl)) && (
        <DefaultEmptyBox message="No resume found." className="w-full" />
      )}
      {!isLoading && !isError && resumeUrl && !resumeLoadError && (
        <>
          <div className="flex flex-col md:flex-row justify-center items-center p-2.5 bg-gray-100 rounded-lg mb-5">
            <div className="flex items-center mb-2.5 md:mb-0 md:mr-5">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="bg-amber-500 text-white border-none px-3 py-2 mx-1 rounded hover:bg-amber-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Previous Page
              </button>
              <span className="font-bold mx-2.5">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= (numPages ?? 0)}
                className="bg-amber-500 text-white border-none px-3 py-2 mx-1 rounded hover:bg-amber-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next Page
              </button>
            </div>

            <div className="flex items-center mb-2.5 md:mb-0 md:mr-5">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.4}
                className="bg-amber-500 text-white border-none px-3 py-2 mx-1 rounded hover:bg-amber-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="font-bold mx-2.5">Zoom: {Math.round(scale * 100)}%</span>
              <button
                onClick={zoomIn}
                className="bg-amber-500 text-white border-none px-3 py-2 mx-1 rounded hover:bg-amber-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <div className="flex items-center">
              <button
                onClick={rotateLeft}
                className="bg-amber-500 text-white border-none px-3 py-2 mx-1 rounded hover:bg-amber-400 transition-colors"
              >
                Rotate Left
              </button>
              <button
                onClick={rotateRight}
                className="bg-amber-500 text-white border-none px-3 py-2 mx-1 rounded hover:bg-amber-400 transition-colors"
              >
                Rotate Right
              </button>
            </div>
          </div>
          {resumeUrl && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
              }}
            >
              <Document
                file={resumeUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<ResumeBoxSkeleton />}
              >
                <Page pageNumber={pageNumber} scale={scale} rotate={rotation} />
              </Document>
            </div>
          )}
        </>
      )}
      {resumeLoadError && <DefaultEmptyBox message="Error loading resume." className="w-full" />}

      {/* <p className="text-gray-600 mb-4">
        Download my full resume or view it online.
      </p>
      <button className="bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] px-4 py-2 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity">
        Download Resume
      </button> */}
    </div>
  );
};
