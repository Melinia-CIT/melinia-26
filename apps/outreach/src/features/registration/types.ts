// Types
export interface FormData {
    email: string;
    otp: string;
    passwd: string;
    confirmPasswd: string;
    firstName: string;
    lastName: string;
    college: string;
    degree: string;
    otherDegree: string;
    year: string;
    ph_no: string;
  }
  
  export interface Errors {
    [key: string]: string;
  }
  
  export interface Step {
    number: number;
    label: string;
}

  