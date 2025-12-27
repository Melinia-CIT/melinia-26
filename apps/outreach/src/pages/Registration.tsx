import React, { useState } from 'react';
import {EmailStep, OTPStep, PasswordStep, ProfileStep, FormData, Errors, ProgressBar, Step} from '../features/registration';



// Main Register Component
const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    otp: '',
    passwd: '',
    confirmPasswd: '',
    firstName: '',
    lastName: '',
    college: '',
    degree: '',
    otherDegree: '',
    year: '',
    ph_no: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const steps: Step[] = [
    { number: 1, label: 'Email' },
    { number: 2, label: 'OTP' },
    { number: 3, label: 'Password' },
    { number: 4, label: 'Profile' },
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateOTP = (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
  };

  const validatePassword = (passwd: string): boolean => {
    return (
      passwd.length >= 8 &&
      /[A-Z]/.test(passwd) &&
      /[a-z]/.test(passwd) &&
      /[0-9]/.test(passwd)
    );
  };

  const validateStep = (): boolean => {
    const newErrors: Errors = {};

    if (currentStep === 1) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    if (currentStep === 2) {
      if (!formData.otp) {
        newErrors.otp = 'OTP is required';
      } else if (!validateOTP(formData.otp)) {
        newErrors.otp = 'OTP must be exactly 6 digits';
      }
    }

    if (currentStep === 3) {
      if (!formData.passwd) {
        newErrors.passwd = 'Password is required';
      } else if (!validatePassword(formData.passwd)) {
        newErrors.passwd =
          'Password must be at least 8 characters with uppercase, lowercase, and number';
      }
      if (!formData.confirmPasswd) {
        newErrors.confirmPasswd = 'Confirm password is required';
      } else if (formData.passwd !== formData.confirmPasswd) {
        newErrors.confirmPasswd = 'Passwords do not match';
      }
    }

    if (currentStep === 4) {
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.college) {
        newErrors.college = 'College is required';
      }
      if (!formData.degree) {
        newErrors.degree = 'Degree is required';
      }
      if (formData.degree.toLowerCase() === 'other' && !formData.otherDegree) {
        newErrors.otherDegree = 'Please specify your degree';
      }
      if (!formData.year) {
        newErrors.year = 'Year is required';
      }
      if (!formData.ph_no) {
        newErrors.ph_no = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.ph_no)) {
        newErrors.ph_no = 'Phone number must be exactly 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepSubmit = async (): Promise<void> => {
    if (!validateStep()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    } else {
      console.log('Form submitted:', formData);
      alert('Registration completed successfully!');
      // Reset form or redirect
      setCurrentStep(1);
      setFormData({
        email: '',
        otp: '',
        passwd: '',
        confirmPasswd: '',
        firstName: '',
        lastName: '',
        college: '',
        degree: '',
        otherDegree: '',
        year: '',
        ph_no: '',
      });
    }

    setIsLoading(false);
  };

  const handleInputChange = (name: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-2 py-3 items-center">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full h-36 sm:h-40 rounded-2xl bg-[image:url('/melinia-alt.jpg')] bg-cover bg-center mb-10" />

        <ProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />

        <div className="w-full bg-zinc-900 rounded-lg p-6 mb-6">
          {currentStep === 1 && (
            <EmailStep
              email={formData.email}
              onEmailChange={(value) => handleInputChange('email', value)}
              onSubmit={handleStepSubmit}
              errors={errors}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && (
            <OTPStep
              otp={formData.otp}
              onOtpChange={(value) => handleInputChange('otp', value)}
              onSubmit={handleStepSubmit}
              errors={errors}
              email={formData.email}
              isLoading={isLoading}
            />
          )}

          {currentStep === 3 && (
            <PasswordStep
              passwd={formData.passwd}
              confirmPasswd={formData.confirmPasswd}
              onPasswordChange={handleInputChange}
              onSubmit={handleStepSubmit}
              errors={errors}
              isLoading={isLoading}
            />
          )}

          {currentStep === 4 && (
            <ProfileStep
              formData={{
                firstName: formData.firstName,
                lastName: formData.lastName,
                college: formData.college,
                degree: formData.degree,
                otherDegree: formData.otherDegree,
                year: formData.year,
                ph_no: formData.ph_no,
              }}
              onInputChange={handleInputChange}
              onSubmit={handleStepSubmit}
              errors={errors}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;