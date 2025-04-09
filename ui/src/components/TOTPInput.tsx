import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

// Define the expected props type (optional but good practice with TypeScript)
interface TwoFactorInputProps {
  onSubmit: (otp: string) => void; // Callback function when all digits are filled
  numberOfDigits?: number;       // Optional: number of digits (defaults to 6)
}

const TwoFactorInput: React.FC<TwoFactorInputProps> = ({
  onSubmit,
  numberOfDigits = 6,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(numberOfDigits).fill(''));
  // Create refs for each input field
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Effect to focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Effect to assign refs to the input elements after render
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, numberOfDigits);
  }, [numberOfDigits]);

  // Effect to check if OTP is complete and call onSubmit
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === numberOfDigits) {
      onSubmit(otpString);
      // Optionally blur the last input or keep focus
      // inputRefs.current[numberOfDigits - 1]?.blur();
    }
  }, [otp, numberOfDigits]);


  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Allow only single digit numbers
    if (!/^[0-9]?$/.test(value)) {
      return; // Ignore non-numeric or multi-character input
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to the next input if a digit was entered
    if (value && index < numberOfDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    // Move focus backward on Backspace if the current input is empty
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Allow navigation with arrow keys (optional enhancement)
    if (event.key === 'ArrowLeft' && index > 0) {
       inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < numberOfDigits - 1) {
       inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault(); // Prevent default paste behavior
    const pasteData = event.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').split(''); // Remove non-digits and split

    if (digits.length === 0) return;

    // Distribute pasted digits across inputs starting from the current one
    const currentFocusIndex = inputRefs.current.findIndex(ref => ref === document.activeElement);
    const startIndex = currentFocusIndex !== -1 ? currentFocusIndex : 0;

    const newOtp = [...otp];
    let focusIndex = startIndex;

    for (let i = 0; i < digits.length && startIndex + i < numberOfDigits; i++) {
        newOtp[startIndex + i] = digits[i];
        focusIndex = startIndex + i;
    }

    setOtp(newOtp);

    // Focus the next empty input or the last filled input
    const nextEmptyIndex = newOtp.findIndex((val, idx) => idx > focusIndex && !val);
    const focusTargetIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(focusIndex + 1, numberOfDigits - 1);

    // Ensure focus moves even if pasting fewer than remaining digits
    // Use timeout to allow state update before focusing
    setTimeout(() => {
        inputRefs.current[focusTargetIndex]?.focus();
        // Select the content of the focused input after paste (optional, for user feedback)
        inputRefs.current[focusTargetIndex]?.select();
    }, 0);

  };


  return (
    <div className="flex items-center justify-center space-x-2" onPaste={handlePaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)} // Assign ref
          type="text" // Use text for better control, handle validation manually
          inputMode="numeric" // Hint for mobile numeric keyboard
          pattern="[0-9]*"    // Pattern for browsers that support it
          maxLength={1}       // Only allow one character
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-semibold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-400 focus:outline-none transition duration-200 ease-in-out appearance-none"
          // Basic styling with Tailwind
          // Adjust w-*, h-*, text-* as needed
          // Added focus states
          // appearance-none might help prevent number input spinners in some browsers
          aria-label={`Digit ${index + 1} of OTP`} // Accessibility label
        />
      ))}
    </div>
  );
};

export default TwoFactorInput;
