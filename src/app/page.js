"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import localforage from "localforage";
import JsBarcode from "jsbarcode";
import Head from "next/head";

const schema = yup.object().shape({
  fullName: yup.string().required("Full Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  avatar: yup.mixed().test("fileRequired", "Avatar is required", (value) => {
    return value instanceof File || (typeof value === "string" && value.length > 0);
  }),
  ticketPrice: yup.string().required("Ticket selection is required"),
  ticketQuantity: yup.string().required("Ticket quantity is required"),
});

export default function Home() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const [ticket, setTicket] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState("");
  const barcodeRef = useRef(null);

  useEffect(() => {
    async function loadFormData() {
      const savedData = await localforage.getItem("formData");
      if (savedData) {
        Object.keys(savedData).forEach((key) => setValue(key, savedData[key]));
      }
    }
    loadFormData();
  }, [setValue]);

  useEffect(() => {
    const subscription = watch((data) => {
      localforage.setItem("formData", data);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const generateRandomBarcode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(URL.createObjectURL(file));
      setValue("avatar", file, { shouldValidate: true });
    }
  };

  const onSubmit = (data) => {
    if (!avatarFile) {
      alert("Please upload an avatar.");
      return;
    }
    const barcodeValue = generateRandomBarcode();
    setTicket({ ...data, avatar: avatarFile, barcode: barcodeValue });
  };

  useEffect(() => {
    if (ticket?.barcode && barcodeRef.current) {
      JsBarcode(barcodeRef.current, ticket.barcode, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: true,
      });
    }
  }, [ticket]);

  return (
    <>
      <Head>
        <title>Tickets</title>
        <link rel="icon" href="/ticket-icon.png" />
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0f29] p-4">
        {!ticket && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[#16213e] p-6 rounded-lg shadow-md w-full max-w-md border border-blue-400"
          >
            <h2 className="text-xl font-bold mb-4 text-white">Conference Ticket Form</h2>
            <label className="block mb-2 text-white">Full Name</label>
            <input
              {...register("fullName")}
              className="w-full p-2 border rounded mb-2 text-black"
            />
            <p className="text-red-500 text-sm">{errors.fullName?.message}</p>

            <label className="block mt-4 mb-2 text-white">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full p-2 border rounded mb-2 text-black"
            />
            <p className="text-red-500 text-sm">{errors.email?.message}</p>

            <label className="block mt-4 mb-2 text-white">Upload Avatar</label>
            <input
              type="file"
              accept="image/*"
              className="w-full p-2 border rounded mb-2 text-white"
              onChange={handleFileChange}
            />
            <p className="text-red-500 text-sm">{errors.avatar?.message}</p>

            <label className="block mt-4 mb-2 text-white">Select Ticket Type</label>
            <div className="flex space-x-2">
              {["$50 - Early Bird", "$75 - Regular", "$100 - VIP"].map((price) => (
                <button
                  type="button"
                  key={price}
                  className={`p-2 border rounded text-white ${selectedPrice === price ? 'bg-blue-500' : 'bg-blue-300'}`}
                  onClick={() => {
                    setSelectedPrice(price);
                    setValue("ticketPrice", price, { shouldValidate: true });
                  }}
                >
                  {price}
                </button>
              ))}
            </div>
            <p className="text-red-500 text-sm">{errors.ticketPrice?.message}</p>

            <label className="block mt-4 mb-2 text-white">Number of Tickets</label>
            <select {...register("ticketQuantity")} className="w-full p-2 border rounded mb-2 text-black">
              {[...Array(10).keys()].map((num) => (
                <option key={num + 1} value={num + 1}>{num + 1}</option>
              ))}
            </select>
            <p className="text-red-500 text-sm">{errors.ticketQuantity?.message}</p>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600"
            >
              Generate Ticket
            </button>
          </form>
        )}

        {ticket && (
          <div className="mt-6 bg-[#16213e] p-4 rounded-lg shadow-md text-center border border-blue-400">
            <h3 className="text-lg font-bold text-white">Your Ticket</h3>
            <img src={ticket.avatar} alt="Avatar" className="w-24 h-24 rounded-full mx-auto mt-2" />
            <p className="mt-2 font-semibold text-white">{ticket.fullName}</p>
            <p className="text-gray-300">{ticket.email}</p>
            <p className="text-gray-300">{ticket.ticketPrice}</p>
            <p className="text-gray-300">Tickets: {ticket.ticketQuantity}</p>
            <svg ref={barcodeRef} className="mx-auto mt-4"></svg>
          </div>
        )}
      </div>
    </>
  );
}



