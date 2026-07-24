import React, { useState } from "react";
import Input from "../components/invoice/Input";
import Select from "../components/invoice/Select";
import Radio from "../components/invoice/Radio";
import Button from "../components/invoice/Button";
import { FileDown, CheckCircle2, Smartphone, Wallet } from "lucide-react";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { saveInvoice } from "../firebase/invoiceService";

const InvoiceGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [candidate, setCandidate] = useState({
    name: "",
    course: "",
    duration: "1 Month",
    year: "",
    college: "",
    location: "",
    payment: "UPI",
    baseAmount: 3500,
  });

  const handleChange = (e) => {
    setCandidate({ ...candidate, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!candidate.name || !candidate.course) {
      alert("Please fill in at least the candidate name and course.");
      return;
    }

    setLoading(true);
    
    const baseAmount = Number(candidate.baseAmount) || 3500;
    const invoiceData = {
      ...candidate,
      baseAmount,
    };
    
    // Attempt to save to Firebase
    const result = await saveInvoice(invoiceData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Generate PDF with the saved ID
      await generateInvoicePDF({ ...invoiceData, invoiceId: result.id, invoiceNumber: result.invoiceNumber });
    } else {
      console.warn("Firebase save failed, falling back to local PDF generation.");
      const dummyNumber = `CGS-INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      // Generate PDF anyway, even if saving failed
      await generateInvoicePDF({ ...invoiceData, invoiceId: "LOCAL-" + dummyNumber, invoiceNumber: dummyNumber });
      
      // Still notify user but don't block them from the PDF
      alert("Note: PDF generated, but could not be saved to history. (Firebase error)");
    }
    
    setLoading(false);
  };

  const baseAmount = Number(candidate.baseAmount) || 0;
  const totalAmount = baseAmount;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="text-center md:text-left mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Invoice Generator</h1>
        <p className="text-slate-400 font-medium">Generate professional internship training invoices instantly.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 p-8 md:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Candidate Name *" 
            name="name" 
            placeholder="John Doe" 
            value={candidate.name} 
            onChange={handleChange} 
          />
          <Select 
            label="Internship / Course *" 
            name="course" 
            value={candidate.course} 
            options={[
              { label: "Web Development", value: "Web Development" },
              { label: "UI/UX Design", value: "UI/UX Design" },
              { label: "Data Analytics", value: "Data Analytics" },
              { label: "SAP", value: "SAP" },
              { label: "AI/ML", value: "AI/ML" },
              { label: "Digital Marketing", value: "Digital Marketing" },
              { label: "Content Creation", value: "Content Creation" },
              { label: "CRM", value: "CRM" },
              { label: "Finance", value: "Finance" },
            ]}
            onChange={handleChange} 
          />
          <Select 
            label="Duration *" 
            name="duration" 
            value={candidate.duration} 
            options={[
              { label: "15 Days", value: "15 Days" },
              { label: "1 Month", value: "1 Month" },
              // { label: "2 Months", value: "2 Months" },
              // { label: "3 Months", value: "3 Months" },
              // { label: "6 Months", value: "6 Months" },
            ]}
            onChange={handleChange} 
          />
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Base Amount (₹) *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCandidate({ ...candidate, baseAmount: 3500 })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    candidate.baseAmount == 3500
                      ? "bg-violet-500/20 text-violet-300 border-violet-500"
                      : "bg-[#0B0F19]/50 text-slate-400 border-[#2D334A]/50 hover:text-white"
                  }`}
                >
                  ₹3,500
                </button>
                <button
                  type="button"
                  onClick={() => setCandidate({ ...candidate, baseAmount: 4130 })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    candidate.baseAmount == 4130
                      ? "bg-amber-500/20 text-amber-300 border-amber-500"
                      : "bg-[#0B0F19]/50 text-slate-400 border-[#2D334A]/50 hover:text-white"
                  }`}
                >
                  ₹4,130 (GST)
                </button>
              </div>
            </div>
            <Input 
              name="baseAmount" 
              type="number"
              placeholder="3500" 
              value={candidate.baseAmount} 
              onChange={handleChange} 
            />
          </div>
          <Select 
            label="Current Year / Status" 
            name="year" 
            value={candidate.year} 
            options={[
              { label: "1st Year", value: "1st Year" },
              { label: "2nd Year", value: "2nd Year" },
              { label: "3rd Year", value: "3rd Year" },
              { label: "Final Year", value: "Final Year" },
              { label: "Graduated", value: "Graduated" },
            ]}
            onChange={handleChange} 
            required={false}
          />
          <Input 
            label="College Name" 
            name="college" 
            placeholder="Tech Institute of Science" 
            value={candidate.college} 
            onChange={handleChange} 
            required={false}
          />
          <Input 
            label="Location" 
            name="location" 
            placeholder="Chennai, India" 
            value={candidate.location} 
            onChange={handleChange} 
            required={false}
          />
        </div>

        {/* Invoice Summary Box */}
        <div className="p-6 bg-violet-500/5 rounded-2xl border border-violet-500/10 space-y-3">
          <h4 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Invoice Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            <span>Duration:</span> <span className="font-semibold text-white text-right">{candidate.duration || "N/A"}</span>
            <span className="text-base text-white pt-3 border-t border-[#2D334A]/50">Total Amount:</span> 
            <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400 pt-3 border-t border-[#2D334A]/50 text-right">₹ {totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Payment Method</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Radio 
              label="UPI Payment" 
              name="payment" 
              value="UPI" 
              checked={candidate.payment === "UPI"} 
              onChange={handleChange} 
              icon={Smartphone}
            />
            <Radio 
              label="Hand Cash" 
              name="payment" 
              value="CASH" 
              checked={candidate.payment === "CASH"} 
              onChange={handleChange} 
              icon={Wallet}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex flex-wrap gap-4">
          <Button 
            type="submit" 
            disabled={loading} 
            variant="primary"
            icon={success ? CheckCircle2 : FileDown}
            className="w-full sm:w-auto"
          >
            {loading ? "Generating..." : success ? "Invoice Generated!" : "Generate & Save Invoice"}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => setCandidate({
              name: "", 
              course: "", 
              duration: "1 Month", 
              year: "", 
              college: "", 
              location: "", 
              payment: "UPI",
              baseAmount: 3500
            })}
            className="w-full sm:w-auto"
          >
            Clear Form
          </Button>
        </div>
      </form>

      {success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-center font-bold">
          Invoice saved successfully! PDF download started.
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
