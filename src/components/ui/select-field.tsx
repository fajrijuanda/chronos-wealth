"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectFieldOption {
  value: string;
  label: string;
}

export function SelectField({
  id,
  name,
  defaultValue,
  placeholder,
  options,
}: {
  id: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  options: SelectFieldOption[];
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder ?? "Pilih opsi"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
