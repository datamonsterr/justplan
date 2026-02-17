import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button Component", () => {
  it("should render with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should apply default variant by default", () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByText("Primary Button");
    expect(button).toHaveClass("bg-primary");
  });

  it("should apply secondary variant", () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByText("Secondary Button");
    expect(button).toHaveClass("bg-secondary");
  });

  it("should apply outline variant", () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByText("Outline Button");
    expect(button).toHaveClass("border");
  });

  it("should apply default size by default", () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByText("Default Button");
    expect(button).toHaveClass("px-4");
  });

  it("should apply small size", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByText("Small Button");
    expect(button).toHaveClass("px-3");
  });

  it("should apply large size", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByText("Large Button");
    expect(button).toHaveClass("px-8");
  });

  it("should handle click events", async () => {
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByText("Click me");

    await userEvent.click(button);
    expect(clicked).toBe(true);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText("Disabled Button");
    expect(button).toBeDisabled();
  });

  it("should accept custom className", () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByText("Custom Button");
    expect(button).toHaveClass("custom-class");
  });

  it("should accept additional HTML button props", () => {
    render(
      <Button type="submit" id="submit-btn">
        Submit
      </Button>
    );
    const button = screen.getByText("Submit");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("id", "submit-btn");
  });
});
