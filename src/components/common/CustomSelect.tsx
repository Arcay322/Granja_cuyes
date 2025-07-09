import { FC, useState, ReactNode } from 'react';
import {
  Select, MenuItem, FormControl, InputLabel, SelectProps
} from '../../utils/mui';

// Omitimos la dependencia de SelectChangeEvent
interface CustomSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  children: ReactNode;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

const CustomSelect: FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  children,
  fullWidth = false,
  size = 'medium',
  required = false,
  disabled = false,
  name
}) => {
  // Manejamos el cambio internamente sin depender de SelectChangeEvent
  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size} required={required}>
      <InputLabel id={`${name || label}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name || label}-label`}
        value={value}
        label={label}
        onChange={handleChange}
        disabled={disabled}
        name={name}
      >
        {children}
      </Select>
    </FormControl>
  );
};

export default CustomSelect;
