"use client";

import { Suspense } from "react";
import PaginationControl from "./pagination-control";

interface PaginationControlWrapperProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  siblingCount?: number;
  className?: string;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  preserveParams?: boolean;
}

// This component safely wraps the PaginationControl in a Suspense boundary
export default function PaginationControlWrapper(props: PaginationControlWrapperProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-2">
        <div className="h-10 w-64 bg-muted rounded"></div>
      </div>
    }>
      <PaginationControl {...props} />
    </Suspense>
  );
}
