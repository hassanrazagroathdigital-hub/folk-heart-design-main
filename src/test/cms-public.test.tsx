/**
 * Public site without Supabase configured (the test env has no VITE_SUPABASE_*):
 * pages render the original built-in content, and forms still work via Formspree.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import Shop from "@/pages/Shop";
import CustomOrder from "@/pages/CustomOrder";
import Contact from "@/pages/Contact";
import AdminApp from "@/pages/admin/AdminApp";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { submitInquiry, InquiryError, FORMSPREE_ENDPOINT } from "@/lib/cms/inquiries";

function wrap(ui: ReactNode, path = "/") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("public site without Supabase", () => {
  it("test environment really has no Supabase config", () => {
    expect(isSupabaseConfigured).toBe(false);
  });

  it("Shop shows the original products and filters by ?category=", async () => {
    wrap(
      <Routes>
        <Route path="/shop" element={<Shop />} />
      </Routes>,
      "/shop?category=Loveys",
    );
    expect(await screen.findByText("Monkey Lovey Blanket")).toBeInTheDocument();
    expect(screen.queryByText("ABC & 123 Learning Quilt")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(await screen.findByText("ABC & 123 Learning Quilt")).toBeInTheDocument();
    expect(screen.getAllByText("1 Available").length).toBe(5);
    expect(screen.getByRole("heading", { level: 1, name: "Shop Handmade Goods" })).toBeInTheDocument();
  });

  it("Custom Order page shows the default FAQs", async () => {
    wrap(<CustomOrder />);
    expect(await screen.findByText("How long does a custom order take?")).toBeInTheDocument();
    expect(screen.getByText("Do you ship?")).toBeInTheDocument();
  });

  it("Contact page shows contact details from default settings", async () => {
    wrap(<Contact />);
    expect((await screen.findAllByText("hello@matkaandmethreads.com")).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1, name: "Say Hello" })).toBeInTheDocument();
  });

  it("Contact form submits via Formspree and shows success", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    wrap(<Contact />);
    fireEvent.change(await screen.findByLabelText("Name *"), { target: { value: "Ann" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "ann@example.com" } });
    fireEvent.change(screen.getByLabelText("Message *"), { target: { value: "Hello!" } });
    fireEvent.click(screen.getByRole("button", { name: "send message" }));
    expect(await screen.findByText(/Message Sent!/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(FORMSPREE_ENDPOINT, expect.objectContaining({ method: "POST" }));
  });

  it("Contact form shows an error (not fake success) when sending fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    wrap(<Contact />);
    fireEvent.change(await screen.findByLabelText("Name *"), { target: { value: "Ann" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "ann@example.com" } });
    fireEvent.change(screen.getByLabelText("Message *"), { target: { value: "Hello!" } });
    fireEvent.click(screen.getByRole("button", { name: "send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't be sent/);
    expect(screen.queryByText(/Message Sent!/)).not.toBeInTheDocument();
  });

  it("honeypot submissions are silently dropped", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const form = document.createElement("form");
    form.innerHTML = '<input name="_gotcha" value="bot">';
    await expect(
      submitInquiry({ type: "contact", name: "Bot", email: "b@x.co", message: "spam" }, form),
    ).resolves.toEqual({ savedToCms: false, emailed: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submitInquiry throws InquiryError when no channel accepts it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    const form = document.createElement("form");
    await expect(submitInquiry({ type: "contact", name: "A", email: "a@b.co", message: "m" }, form)).rejects.toBeInstanceOf(InquiryError);
  });

  it("/admin explains that Supabase must be configured", async () => {
    wrap(
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>,
      "/admin",
    );
    expect(await screen.findByText("Supabase isn't connected yet")).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.classList.contains("admin-theme")).toBe(true));
  });
});
