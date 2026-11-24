import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./IdenticalWord", () => ({ default: () => <div>root chips</div> }));
vi.mock("./Category", () => ({ default: () => <div>categories</div> }));

import Motif from "./index";

describe("Motif tool: Repeated Roots", () => {
  it("titles the section Repeated Roots", () => {
    render(<Motif />);
    expect(screen.getByText("Repeated Roots")).toBeInTheDocument();
    expect(screen.queryByText("Identical Words")).not.toBeInTheDocument();
  });

  it("opens the info popup from the info icon without collapsing the section, and closes it", () => {
    render(<Motif />);
    fireEvent.click(screen.getByLabelText("About repeated roots"));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Double-Click a Word");
    expect(dialog).toHaveTextContent("Root Chips");
    expect(dialog).toHaveTextContent("Smart Highlight");
    expect(dialog).toHaveTextContent("Proper names are only matched with the same name");
    expect(screen.getByText("root chips")).toBeInTheDocument(); // section stayed open

    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the info popup with Escape", () => {
    render(<Motif />);
    fireEvent.click(screen.getByLabelText("About repeated roots"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
