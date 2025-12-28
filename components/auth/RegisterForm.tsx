"use client";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineUser, AiOutlineIdcard, AiOutlineMan, AiOutlineMail, AiOutlineLock, AiOutlineReload, AiOutlineCheckCircle } from "react-icons/ai";
import { api } from "@/client/trpc";

export default function RegisterForm({ refId = "1" }: { refId?: string }) {
  const router = useRouter();
  const registerMutation = api.auth.register.useMutation();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    screenname: "",
    gender: "" as "male" | "female" | "",
    email: "",
    password: "",
    confirmPassword: "",
    ref_id: refId,
    captcha: "", 
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [captchaNums, setCaptchaNums] = useState<[number, number]>([0, 0]);
  const [captchaKey, setCaptchaKey] = useState(0); // for resetting

  useEffect(() => {
    // Generate two random numbers for the captcha
    setCaptchaNums([
      Math.floor(Math.random() * 10) + 1,
      Math.floor(Math.random() * 10) + 1,
    ]);
  }, [captchaKey]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value,
    }));
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    
    // Validate captcha
    if (parseInt(form.captcha, 10) !== captchaNums[0] + captchaNums[1]) {
      setErr("Incorrect captcha answer. Please try again.");
      setForm((prev) => ({ ...prev, captcha: "" }));
      setCaptchaKey((k) => k + 1); // regenerate captcha
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setErr("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Validate that gender is selected
      if (!form.gender) {
        setErr("Please select a gender.");
        setLoading(false);
        return;
      }

      const result = await registerMutation.mutateAsync({
        ...form,
        gender: form.gender as "male" | "female"
      });
      
      if (result.success) {
        // Show success message and redirect to login
        alert("Registration successful! Please log in to continue.");
        router.push("/login");
      }
    } catch (error: any) {
      setErr(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full">
      <div className="flex gap-2">
        <div className="relative w-1/2">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineUser /></span>
          <Input
            name="firstname"
            placeholder="First Name"
            value={form.firstname}
            onChange={handleChange}
            required
            className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#3b3b3b] font-sans font-light focus:border-[#0d3b29] placeholder-[#3b3b3b] rounded-xl"
          />
        </div>
        <div className="relative w-1/2">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineUser /></span>
          <Input
            name="lastname"
            placeholder="Last Name"
            value={form.lastname}
            onChange={handleChange}
            required
            className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#b0b0b0] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] rounded-xl"
          />
        </div>
      </div>
      <div className="relative">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineIdcard /></span>
        <Input
          name="screenname"
          placeholder="Screen Name"
          value={form.screenname}
          onChange={handleChange}
          required
          className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#b0b0b0] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] rounded-xl"
        />
      </div>
      <div className="relative">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineMan /></span>
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          required
          className="block w-full pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#3b3b3b] font-sans font-light focus:border-[#0d3b29] placeholder-[#3b3b3b] rounded-xl"
        >
          <option value="" disabled>
            Select Gender
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="relative">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineMail /></span>
        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#b0b0b0] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] rounded-xl"
        />
      </div>
      <div className="relative">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineLock /></span>
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#b0b0b0] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] rounded-xl"
        />
      </div>
      <div className="relative">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineCheckCircle /></span>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#b0b0b0] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] rounded-xl"
        />
      </div>
      <input
        type="hidden"
        name="ref_id"
        value={form.ref_id}
        readOnly
      />
      <div className="relative">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full border border-[#b0b0b0] text-[#b0b0b0] text-xl pointer-events-none"><AiOutlineReload /></span>
        <Input
          key={captchaKey}
          name="captcha"
          type="number"
          placeholder={`What is ${captchaNums[0]} + ${captchaNums[1]}?`}
          value={form.captcha}
          onChange={handleChange}
          required
          className="pl-10 rounded-full border border-[#a6a6a6] bg-[#f4f4f4] py-4 text-[1.1rem] text-[#b0b0b0] font-sans font-light focus:border-[#0d3b29] placeholder-[#b0b0b0] rounded-xl"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="terms"
          checked={form.terms}
          onChange={handleChange}
          required
          className="h-4 w-4 rounded border-gray-300 text-[#0d3b29] focus:ring-[#0d3b29]"
        />
        <span>I accept the terms and conditions</span>
      </label>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <Button type="submit" disabled={loading || registerMutation.isPending} className="w-full bg-[#0d3b29] text-white rounded-full h-12 text-lg">
        {loading || registerMutation.isPending ? "Registering…" : "REGISTER"}
      </Button>
    </form>
  );
}
