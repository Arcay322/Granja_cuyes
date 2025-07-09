import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select as MuiSelect, 
  MenuItem,
  FormHelperText
} from '../../utils/mui';

interface SelectWrapperProps {
  name: string;
  label: string;
  value: any;
  onChange: (name: string, value: any) => void;
  options: { value: any, label: string }[];
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
}

const SelectWrapper: React.FC<SelectWrapperProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  error = false,
  helperText = '',
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  sx = {}
}) => {
  const handleChange = (e: React.ChangeEvent<{ value: unknown }> & { target: { name?: string; value: unknown } }) => {
    onChange(e.target.name || name, e.target.value);
  };

  return (
    <FormControl
      variant="outlined"
      fullWidth={fullWidth}
      error={error}
      required={required}
      size={size}
      sx={sx}
    >
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <MuiSelect
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value}
        onChange={handleChange as any}
        label={label}
        disabled={disabled}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectWrapper;
