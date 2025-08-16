import { useState } from "react";

function DonateForm() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Processing...");

    const response = await fetch("http://localhost:8000/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount, message }),
    });

    if (response.ok) {
      setStatus("Donation Successful! 🎉");
      setAmount("");
      setName("");
      setMessage("");
    } else {
      setStatus("Something went wrong ❌");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto border rounded-lg">
      <h2 className="text-xl font-bold mb-2">Donate</h2>
      <form onSubmit={handleDonate} className="space-y-2">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Donation Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white w-full py-2 rounded"
        >
          Donate
        </button>
      </form>
      {status && <p className="mt-2 text-center">{status}</p>}
    </div>
  );
}

export default DonateForm;
