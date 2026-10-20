"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

type Program = {
  id: string;
  name: string;
  slug: string;
  sub_text?: string | null;
  details_external?: boolean | null;
  external_link?: string | null;
};

type Session = {
  id: string;
  start_date: string;
  end_date?: string | null;
  language?: string | null;
  registrations_allowed: boolean;
  registration_link?: string | null;
  programs: Program;
};

type Venue = {
  id: string;
  name: string;
  address?: string | null;
  google_maps_url?: string | null;
  sessions: Session[];
};

type City = {
  id: string;
  name: string;
  slug: string;
  venues: Venue[];
};

interface Props {
  citiesData: City[];
}

export default function CenterProgramsTable({ citiesData }: Props) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // 1. Download CSV Function
  const handleDownloadCSV = () => {
    const headers = [
      "City",
      "Center / Venue",
      "Program Name",
      "Start Date",
      "End Date",
      "Language",
      "Registration Link",
    ];

    const rows: string[][] = [];

    citiesData.forEach((city) => {
      city.venues?.forEach((venue) => {
        venue.sessions?.forEach((session) => {
          const program = session.programs;
          if (!program) return;

          rows.push([
            `"${(city.name || "").replace(/"/g, '""')}"`,
            `"${(venue.name || "").replace(/"/g, '""')}"`,
            `"${(program.name || "").replace(/"/g, '""')}"`,
            `"${session.start_date || ""}"`,
            `"${session.end_date || ""}"`,
            `"${session.language || ""}"`,
            `"${session.registration_link || program.external_link || ""}"`,
          ]);
        });
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `isha_kerala_upcoming_programs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download Image (PNG) Function
  const handleDownloadImage = async () => {
    if (!tableContainerRef.current) return;
    setIsGeneratingImg(true);

    try {
      const dataUrl = await toPng(tableContainerRef.current, {
        cacheBust: true,
        backgroundColor: "#F7F6F2",
        style: {
          overflow: "visible",
          height: "auto",
          maxHeight: "none",
          width: "auto",
          maxWidth: "none",
          padding: "24px",
          borderRadius: "16px",
        },
      });

      const link = document.createElement("a");
      link.download = `isha_kerala_upcoming_programs.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
      alert("Could not export image. Please try again.");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // 3. Download Optimized Multi-Page PDF Function
  const handleDownloadPDF = async () => {
    if (!tableContainerRef.current) return;
    setIsGeneratingPdf(true);

    const element = tableContainerRef.current;

    // Create an attractive temporary header for the PDF
    const pdfHeader = document.createElement("div");
    pdfHeader.className = "pdf-temp-header";
    pdfHeader.style.cssText =
      "padding: 16px 0 24px 0; text-align: center; border-bottom: 3px solid #F28C18; margin-bottom: 20px;";
    pdfHeader.innerHTML = `
      <h1 style="font-size: 26px; font-weight: bold; color: #1F2A63; margin: 0 0 6px 0; letter-spacing: -0.5px;">Upcoming Programs in Kerala</h1>
      <p style="font-size: 13px; font-weight: 700; color: #F28C18; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">Isha Foundation • Center Schedule</p>
    `;

    element.insertBefore(pdfHeader, element.firstChild);

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#F7F6F2",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save("isha_kerala_upcoming_programs.pdf");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Could not export PDF. Please try again.");
    } finally {
      element.removeChild(pdfHeader);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
        >
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={isGeneratingImg}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none disabled:opacity-50"
        >
          <svg className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isGeneratingImg ? "Generating Image..." : "Download Image"}
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="inline-flex items-center gap-2 rounded-full bg-[#F28C18] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>

      {/* Unified Master Table Container */}
      <div ref={tableContainerRef} className="bg-[#F7F6F2] p-3 sm:p-6 rounded-3xl">
        <div className="rounded-2xl border border-black/10 bg-white shadow-md overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm text-slate-800 table-fixed">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[28%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-slate-100 text-slate-900 uppercase text-[12px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3.5">Program</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5">Center / Venue</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5">Start Date</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5">End Date</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5">Language</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {citiesData.map((city) => {
                const citySessions = city.venues.flatMap((venue) =>
                  (venue.sessions || []).map((session) => ({
                    ...session,
                    venueName: venue.name,
                  }))
                );

                if (citySessions.length === 0) return null;

                return (
                  <React.Fragment key={city.id}>
                    {/* Soft Light Amber/Yellow City Banner Header */}
                    <tr className="bg-[#FEF3C7] border-y border-amber-200">
                      <td colSpan={5} className="px-4 sm:px-6 py-3 text-base font-bold tracking-wide text-[#1F2A63]">
                        {city.name}
                      </td>
                    </tr>

                    {/* Program Rows for this City */}
                    {citySessions.map((session) => {
                      const program = session.programs;
                      if (!program) return null;

                      return (
                        <tr key={session.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-sm">
                            {program.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-normal text-slate-700 text-sm">
                            {session.venueName}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-slate-800 text-sm">
                            {new Date(session.start_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-600 text-sm">
                            {session.end_date
                              ? new Date(session.end_date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-600 text-sm font-normal">
                            {session.language || "English"}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}