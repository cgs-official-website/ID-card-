import React, { useState } from "react";
import Input from "../components/invoice/Input";
import Select from "../components/invoice/Select";
import Button from "../components/invoice/Button";
import { FileDown, CheckCircle2 } from "lucide-react";
import { generateOfferLetterPDF } from "../utils/offerLetterPdfGenerator";
import { saveOfferLetter } from "../firebase/offerLetterService";

const OfferLetterGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [candidate, setCandidate] = useState({
    name: "",
    role: "Software Engineer Intern",
    startDate: new Date().toISOString().split('T')[0],
    duration: "1 Month",
    stipend: "Unpaid",
  });

  const handleChange = (e) => {
    setCandidate({ ...candidate, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!candidate.name || !candidate.role) {
      alert("Please fill in at least the candidate name and role.");
      return;
    }

    setLoading(true);
    
    const offerData = { ...candidate };
    
    // Attempt to save to Firebase
    const result = await saveOfferLetter(offerData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Generate PDF with the saved ID
      await generateOfferLetterPDF({ ...offerData, id: result.id, offerNumber: result.offerNumber });
    } else {
      console.warn("Firebase save failed, falling back to local PDF generation.");
      const dummyNumber = `CGS-OFF-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      // Generate PDF anyway, even if saving failed
      await generateOfferLetterPDF({ ...offerData, id: "LOCAL-" + dummyNumber, offerNumber: dummyNumber });
      
      // Still notify user but don't block them from the PDF
      alert("Note: PDF generated, but could not be saved to history. (Firebase error)");
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="text-center md:text-left mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Offer Letter Generator</h1>
        <p className="text-gray-400 font-medium">Generate professional offer letters instantly.</p>
      </div>

      <form onSubmit={handleSubmit} className="premium-card p-8 md:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Candidate Name *" 
            name="name" 
            placeholder="John Doe" 
            value={candidate.name} 
            onChange={handleChange} 
          />
          <Input 
            label="Role / Position *" 
            name="role" 
            placeholder="Software Engineer Intern" 
            value={candidate.role} 
            onChange={handleChange} 
          />
          <Input 
            label="Start Date *" 
            type="date"
            name="startDate" 
            value={candidate.startDate} 
            onChange={handleChange} 
          />
          <Select 
            label="Duration *" 
            name="duration" 
            value={candidate.duration} 
            options={[
              { label: "15 Days", value: "15 Days" },
              { label: "1 Month", value: "1 Month" },
              { label: "2 Months", value: "2 Months" },
              { label: "3 Months", value: "3 Months" },
              { label: "6 Months", value: "6 Months" },
            ]}
            onChange={handleChange} 
          />
          <div className="md:col-span-2">
            <Input 
              label="Stipend / Salary" 
              name="stipend" 
              placeholder="e.g., Rs. 5000/month or 'Unpaid'" 
              value={candidate.stipend} 
              onChange={handleChange} 
              required={false}
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
            {loading ? "Generating..." : success ? "Offer Letter Generated!" : "Generate & Save Offer Letter"}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => setCandidate({
              name: "", 
              role: "Software Engineer Intern", 
              startDate: new Date().toISOString().split('T')[0], 
              duration: "1 Month", 
              stipend: "Unpaid"
            })}
            className="w-full sm:w-auto"
          >
            Clear Form
          </Button>
        </div>
      </form>

      {success && (
        <div className="p-4 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-2xl text-center font-bold">
          Offer Letter saved successfully! PDF download started.
        </div>
      )}
    </div>
  );
};

export default OfferLetterGenerator;
