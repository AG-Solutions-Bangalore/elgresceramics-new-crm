import { DISPATCH_RETURN_EDIT_LIST } from "@/api";
import apiClient from "@/api/axios";
import usetoken from "@/api/usetoken";
import { decryptId } from "@/components/common/Encryption";
import { Button } from "@/components/ui/button";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useQuery } from "@tanstack/react-query";
import html2pdf from "html2pdf.js";
import { Loader, Printer } from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Page from "../dashboard/page";

const DispatchReturnView = () => {
  const { id } = useParams();
  const decryptedId = decryptId(id);
  const containerRef = useRef();
  const token = usetoken();
  const [ispdf, setIsPdf] = useState(false);
  const [ispdfloading, setIsPdfloading] = useState(false);
  const [dispatch, setDispatch] = useState({});
  const [buyer, setBuyer] = useState({});
  const [dispatchsubData, setDispatchSubData] = useState([]);
  const singlebranch = useSelector((state) => state.auth.branch_s_unit);
  const doublebranch = useSelector((state) => state.auth.branch_d_unit);
  const handlePrintPdf = useReactToPrint({
    content: () => containerRef.current,
    documentTitle: "Dispatch_Return",
    pageStyle: `
      @page {
    size: A4 portrait;
        margin: 5mm;
      }
      @media print {
        body {
          font-size: 10px; 
          margin: 0mm;
          padding: 0mm;
        }
        table {
          font-size: 11px;
        }
        .print-hide {
          display: none;
        }
      }
    `,
  });
  const {
    data: DispatchId,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["dispatchByid", decryptedId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${DISPATCH_RETURN_EDIT_LIST}/${decryptedId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
  });

  useEffect(() => {
    if (DispatchId) {
      setDispatch(DispatchId.dispatch);
      setBuyer(DispatchId.buyer);
      setDispatchSubData(DispatchId.dispatchSub);
    }
  }, [DispatchId]);
  const totalDispatchSubBox = dispatchsubData.reduce(
    (total, row) => total + row.dispatch_sub_box,
    0
  );
  const totalDispatchSubPiece = dispatchsubData.reduce(
    (total, row) => total + row.dispatch_sub_piece,
    0
  );
  const totalDispatchWeight = dispatchsubData.reduce(
    (total, row) => total + row.item_weight * row.dispatch_sub_box,
    0
  );

  const handleSaveAsPdf = () => {
    if (!containerRef.current) {
      console.error("Element not found");
      return;
    }
    try {
      setIsPdf(true);
      setIsPdfloading(true)
      setTimeout(() => {
        html2pdf()
          .from(containerRef.current)
          .set({
            margin: 10,
            filename: "Dispatch_Return.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          })
          .save()
          .then(() => {
        setIsPdf(false);
        setIsPdfloading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsPdf(false);
        setIsPdfloading(false);
      });

      }, 100); 
    } catch (error) {
      console.log(error);
      setIsPdf(false);
    }
  };

  console.log(ispdf);
  return (
    <Page>
      <div
        className={`sticky top-0 z-10 border border-gray-200 rounded-lg ${ButtonConfig.cardheaderColor} shadow-sm p-4 mb-2 grid grid-cols-1 overflow-x-auto`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-center sm:text-left">
            Dispatch Return
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              className={`w-full sm:w-auto ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              onClick={handlePrintPdf}
            >
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button
              className={`w-full sm:w-auto ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
              onClick={handleSaveAsPdf}
            >
           {ispdfloading ?    <Loader className="h-4 w-4 mr-1 animate-spin" />   : <Printer className="h-4 w-4 mr-1" />} PDF
            </Button>
          </div>
        </div>
      </div>{" "}
      <div ref={containerRef} className="w-full max-w-3xl mx-auto px-4 pb-4">
        {ispdf ? (
          <h2 className=" font-bold text-lg py-2">Dispatch Return</h2>
        ) : (
          ""
        )}
        <h2 className=" font-bold text-lg py-2 hidden print:block">
          Dispatch Return
        </h2>

        <div className="w-full max-w-3xl mx-auto px-4 pb-4 border border-black bg-white">
          <h2 className="text-center font-bold text-lg py-2 ">RUFF PERFORMA</h2>

          <div className="w-full border border-black mb-4 grid grid-cols-2">
            <div className="border-r border-black">
              <div className="p-2 border-b border-black">
                <span className="font-medium">Name:</span> {buyer.buyer_name}
              </div>
              <div className="p-2">
                <span className="font-medium">Ref No:</span>{" "}
                {dispatch.dispatch_ref_no}
              </div>
            </div>
            <div>
              <div className="p-2 border-b border-black">
                <span className="font-medium">City:</span> {buyer.buyer_city}
              </div>
              <div className="p-2">
                <span className="font-medium">Date:</span>{" "}
                {moment(dispatch.dispatch_date).format("DD-MMM-YYYY")}
              </div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black">
            <thead className="bg-gray-200 border border-black">
              <tr className="border border-black">
                <th className="p-2 border border-black" rowSpan={2}>
                  ITEM NAME
                </th>
                <th className="p-2 border border-black" rowSpan={2}>
                  SIZE
                </th>
                {singlebranch == "Yes" && doublebranch == "Yes" ? (
                  <th
                    className="border border-black px-2 py-2 text-center"
                    colSpan={2}
                  >
                    QUANTITY
                  </th>
                ) : (
                  <th
                    className="border border-black px-2 py-2 text-center"
                    rowSpan={2}
                  >
                    QUANTITY
                  </th>
                )}{" "}
              </tr>
              {singlebranch == "Yes" && doublebranch == "Yes" && (
                <tr>
                  <th className="border border-black px-2 py-2 text-center">
                    Box
                  </th>
                  <th className="border border-black px-2 py-2 text-center">
                    Piece
                  </th>
                </tr>
              )}
            </thead>

            <tbody>
              {dispatchsubData.map((row, index) => (
                <tr key={index} className="border border-black">
                  <td className="p-2 border border-black">{row.item_name}</td>
                  <td className="p-2 border border-black">{row.item_size}</td>

                  {singlebranch == "Yes" && doublebranch == "Yes" ? (
                    <>
                      <td className="border border-black px-2 py-2 text-center">
                        {row.dispatch_sub_box}
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {row.dispatch_sub_piece}
                      </td>
                    </>
                  ) : (
                    <td className="border border-black px-2 py-2 text-right">
                      {row.dispatch_sub_box}
                    </td>
                  )}
                </tr>
              ))}

              <tr className="border border-black bg-gray-200 font-semibold">
                <td className="p-2 border border-black">TOTAL</td>
                <td className="p-2 border border-black"></td>
                {(singlebranch === "Yes" && doublebranch === "No") ||
                (singlebranch === "No" && doublebranch === "Yes") ? (
                  <td className="border border-black px-2 py-2 text-right">
                    {totalDispatchSubBox}
                  </td>
                ) : null}
                {singlebranch === "Yes" && doublebranch === "Yes" && (
                  <>
                    <td className="border border-black px-2 py-2 text-center">
                      {totalDispatchSubBox}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {totalDispatchSubPiece}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>

          {/* Footer Details */}
          <div className="mt-2 text-sm border border-black">
            {totalDispatchWeight ? (
              <p className="py-1 px-2 border-b border-black">
                WEIGHT : {totalDispatchWeight} KG
              </p>
            ) : (
              ""
            )}
            <p className="py-1 px-2 border-b border-black">
              VEHICLE : {dispatch.dispatch_vehicle_no}
            </p>
            <p className="py-1 px-2">REMARK : {dispatch.dispatch_remark}</p>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default DispatchReturnView;
