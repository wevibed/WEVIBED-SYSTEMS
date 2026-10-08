// Field validation for EnquiryForm. Pure so it can be tested without a browser.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param fields [{ name, label, type, required }]
 * @param values { [name]: string }
 * @returns { [name]: message } (empty object when valid)
 */
export function validateFields(fields, values) {
  const errors = {};
  for (const f of fields) {
    const v = String(values[f.name] ?? "").trim();
    if (!v) {
      if (f.required) errors[f.name] = `${f.label} is required`;
      continue;
    }
    if (f.type === "tel" && v.replace(/\D/g, "").length < 7) errors[f.name] = "Enter a valid phone number";
    if (f.type === "email" && !EMAIL.test(v)) errors[f.name] = "Enter a valid email address";
  }
  return errors;
}
