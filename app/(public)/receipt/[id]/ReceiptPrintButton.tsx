"use client";

import * as React from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReceiptPrintButton({ receiptNo }: { receiptNo: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePrint}
        size="sm"
        className="rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold gap-2 shadow-sm"
      >
        <Printer className="w-4 h-4" />
        Print Receipt
      </Button>
    </div>
  );
}
