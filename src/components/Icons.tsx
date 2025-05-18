import React from 'react';

interface IconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const Volunteer: React.FC<IconProps> = ({ width = "800px", height = "800px", className="icon"}) => (
  <svg
    className={className}
    fill="none"
    height={height}
    width={width}
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 491.52 491.52"
    xmlSpace="preserve"
  >
    <g>
      <g>
        <path d="M420.4,221.72l-16.635-4.91l-39.293,39.289c-7.921-4.979-16.579-9.025-25.932-11.829l-17.205-5.09l-75.57,75.57
          l-75.575-75.57l-17.24,5.1c-9.339,2.8-17.987,6.842-25.9,11.816L87.76,216.81l-16.685,4.92C28.565,234.49,0,272.88,0,317.26v82.1
          h78.51v30.72h334.505v-30.72h78.505v-82.1C491.52,272.88,462.955,234.49,420.4,221.72z M78.51,378.88H20.48v-61.62
          c0-35.27,22.7-65.77,56.44-75.9l4.97-1.47l28.841,28.844c-20.16,19.181-32.221,46.109-32.221,75.586V378.88z M392.535,409.6H98.99
          v-65.28c0-37.37,24.05-69.69,59.805-80.41l5.525-1.63l81.445,81.43l81.44-81.43l5.495,1.62c35.79,10.73,59.835,43.05,59.835,80.42
          V409.6z M471.04,378.88h-58.025v-34.56c0-29.475-12.057-56.4-32.223-75.584l28.843-28.846l4.92,1.46
          c33.785,10.13,56.485,40.64,56.485,75.91V378.88z"
          fill='currentColor'
        />
      </g>
    </g>
    <g>
      <g>
        <path d="M332.12,61.44c-19.857,0-38.506,8.451-51.659,22.916c-10.328-5.599-22.146-8.786-34.696-8.786
          c-12.551,0-24.371,3.187-34.699,8.787c-13.153-14.465-31.803-22.917-51.661-22.917c-38.545,0-69.905,31.36-69.905,69.9
          c0,38.55,31.36,69.91,69.905,69.91c10.352,0,20.453-2.284,29.694-6.629c13.405,16.478,33.818,27.039,56.666,27.039
          c22.846,0,43.258-10.559,56.663-27.035c9.239,4.341,19.338,6.625,29.692,6.625c38.545,0,69.905-31.36,69.905-69.91
          C402.025,92.8,370.665,61.44,332.12,61.44z M178.415,176.874c-5.99,2.501-12.41,3.896-19.01,3.896
          c-27.255,0-49.425-22.17-49.425-49.43c0-27.25,22.17-49.42,49.425-49.42c13.341,0,25.884,5.434,35.09,14.747
          c-13.427,13.254-21.775,31.641-21.775,51.953C172.72,158.632,174.752,168.177,178.415,176.874z M245.765,201.18
          c-28.985,0-52.565-23.58-52.565-52.56c0-28.99,23.58-52.57,52.565-52.57s52.565,23.58,52.565,52.57
          C298.33,177.6,274.75,201.18,245.765,201.18z M332.12,180.77c-6.602,0-13.019-1.396-19.006-3.895
          c3.664-8.697,5.696-18.242,5.696-28.255c0-20.314-8.349-38.702-21.777-51.956c9.206-9.311,21.747-14.744,35.087-14.744
          c27.255,0,49.425,22.17,49.425,49.42C381.545,158.6,359.375,180.77,332.12,180.77z"
          fill='currentColor'
        />
      </g>
    </g>
  </svg>
);

export const Donations: React.FC<IconProps> = ({
    width = 24,
    height = 24,
    className = "icon",
  }) => (
<svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid meet"
  >
    <path
      d="M16 6.27975C16 6.88118 15.7625 7.45883 15.3383 7.88611C14.3619 8.87007 13.415 9.89605 12.4021 10.8443C12.17 11.0585 11.8017 11.0507 11.5795 10.8268L8.6615 7.88611C7.7795 6.99725 7.7795 5.56225 8.6615 4.67339C9.55218 3.77579 11.0032 3.77579 11.8938 4.67339L11.9999 4.78027L12.1059 4.67345C12.533 4.24286 13.1146 4 13.7221 4C14.3297 4 14.9113 4.24284 15.3383 4.67339C15.7625 5.10073 16 5.67835 16 6.27975Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill='currentColor'
    />
    <path
      d="M18 20L21.8243 16.1757C21.9368 16.0632 22 15.9106 22 15.7515V10.5C22 9.67157 21.3284 9 20.5 9V9C19.6716 9 19 9.67157 19 10.5V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill='currentColor'

    />
    <path
      d="M18 16L18.8581 15.1419C18.949 15.051 19 14.9278 19 14.7994V14.7994C19 14.6159 18.8963 14.4482 18.7322 14.3661L18.2893 14.1447C17.5194 13.7597 16.5894 13.9106 15.9807 14.5193L15.0858 15.4142C14.7107 15.7893 14.5 16.298 14.5 16.8284V20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill='currentColor'
    />
    <path
      d="M6 20L2.17574 16.1757C2.06321 16.0632 2 15.9106 2 15.7515V10.5C2 9.67157 2.67157 9 3.5 9V9C4.32843 9 5 9.67157 5 10.5V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill='currentColor'
    />
    <path
      d="M6 16L5.14187 15.1419C5.05103 15.051 5 14.9278 5 14.7994V14.7994C5 14.6159 5.10366 14.4482 5.26776 14.3661L5.71067 14.1447C6.48064 13.7597 7.41059 13.9106 8.01931 14.5193L8.91421 15.4142C9.28929 15.7893 9.5 16.298 9.5 16.8284V20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill='currentColor'
    />
  </svg>
  );
  

export const LGU: React.FC<IconProps> = ({ 
  width = 24, 
  height = 24, 
  className = 'icon'
    }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_1251_98416)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C5.96243 0 3.5 2.46243 3.5 5.5C3.5 8.53757 5.96243 11 9 11C12.0376 11 14.5 8.53757 14.5 5.5C14.5 2.46243 12.0376 0 9 0ZM5.5 5.5C5.5 3.567 7.067 2 9 2C10.933 2 12.5 3.567 12.5 5.5C12.5 7.433 10.933 9 9 9C7.067 9 5.5 7.433 5.5 5.5Z"
        fill='currentColor'
        />
      <path
        d="M15.5 0C14.9477 0 14.5 0.447715 14.5 1C14.5 1.55228 14.9477 2 15.5 2C17.433 2 19 3.567 19 5.5C19 7.433 17.433 9 15.5 9C14.9477 9 14.5 9.44771 14.5 10C14.5 10.5523 14.9477 11 15.5 11C18.5376 11 21 8.53757 21 5.5C21 2.46243 18.5376 0 15.5 0Z"
        fill='currentColor'
        />
      <path
        d="M19.0837 14.0157C19.3048 13.5096 19.8943 13.2786 20.4004 13.4997C22.5174 14.4246 24 16.538 24 19V21C24 21.5523 23.5523 22 23 22C22.4477 22 22 21.5523 22 21V19C22 17.3613 21.0145 15.9505 19.5996 15.3324C19.0935 15.1113 18.8625 14.5217 19.0837 14.0157Z"
        fill='currentColor'
        />
      <path
        d="M6 13C2.68629 13 0 15.6863 0 19V21C0 21.5523 0.447715 22 1 22C1.55228 22 2 21.5523 2 21V19C2 16.7909 3.79086 15 6 15H12C14.2091 15 16 16.7909 16 19V21C16 21.5523 16.4477 22 17 22C17.5523 22 18 21.5523 18 21V19C18 15.6863 15.3137 13 12 13H6Z"
        fill='currentColor'
        />
    </g>
    <defs>
      <clipPath id="clip0_1251_98416">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);


export const HeartHandsIcon: React.FC<IconProps> = ({
    width = "100%",
    height = "100%",
    className = "icons",
  }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="scale(1.2) translate(-2,-2)"> {/* Scaled to fill more of the viewBox */}
        <path d="M16 6.27975C16 6.88118 15.7625 7.45883 15.3383 7.88611C14.3619 8.87007 13.415 9.89605 12.4021 10.8443C12.17 11.0585 11.8017 11.0507 11.5795 10.8268L8.6615 7.88611C7.7795 6.99725 7.7795 5.56225 8.6615 4.67339C9.55218 3.77579 11.0032 3.77579 11.8938 4.67339L11.9999 4.78027L12.1059 4.67345C12.533 4.24286 13.1146 4 13.7221 4C14.3297 4 14.9113 4.24284 15.3383 4.67339C15.7625 5.10073 16 5.67835 16 6.27975Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M18 20L21.8243 16.1757C21.9368 16.0632 22 15.9106 22 15.7515V10.5C22 9.67157 21.3284 9 20.5 9V9C19.6716 9 19 9.67157 19 10.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 16L18.8581 15.1419C18.949 15.051 19 14.9278 19 14.7994V14.7994C19 14.6159 18.8963 14.4482 18.7322 14.3661L18.2893 14.1447C17.5194 13.7597 16.5894 13.9106 15.9807 14.5193L15.0858 15.4142C14.7107 15.7893 14.5 16.298 14.5 16.8284V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 20L2.17574 16.1757C2.06321 16.0632 2 15.9106 2 15.7515V10.5C2 9.67157 2.67157 9 3.5 9V9C4.32843 9 5 9.67157 5 10.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 16L5.14187 15.1419C5.05103 15.051 5 14.9278 5 14.7994V14.7994C5 14.6159 5.10366 14.4482 5.26776 14.3661L5.71067 14.1447C6.48064 13.7597 7.41059 13.9106 8.01931 14.5193L8.91421 15.4142C9.28929 15.7893 9.5 16.298 9.5 16.8284V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );

  export const Response: React.FC<IconProps> = ({
    width = '100%',
    height = '100%',
    className = 'icons',
  }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g>
        <path fill="none" d="M0 0H24V24H0z" />
        <path
          d="M16 1c.552 0 1 .448 1 1v3h4c.552 0 1 .448 1 1v14c0 .552-.448 1-1 1H3c-.552 0-1-.448-1-1V6c0-.552.448-1 1-1h4V2c0-.552.448-1 1-1h8zm-3 8h-2v3H8v2h2.999L11 17h2l-.001-3H16v-2h-3V9zm2-6H9v2h6V3z"
          fill="currentColor"
        />
      </g>
    </svg>
  );


export const ArrowDown: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
  }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 -4.5 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g transform="translate(-220.000000, -6684.000000)" fill="currentColor">
          <g transform="translate(56.000000, 160.000000)">
            <path d="M164.292308,6524.36583 C163.902564,6524.77071 163.902564,6525.42619 164.292308,6525.83004 L172.555873,6534.39267 C173.33636,6535.20244 174.602528,6535.20244 175.383014,6534.39267 L183.70754,6525.76791 C184.093286,6525.36716 184.098283,6524.71997 183.717533,6524.31405 C183.328789,6523.89985 182.68821,6523.89467 182.29347,6524.30266 L174.676479,6532.19636 C174.285736,6532.60124 173.653152,6532.60124 173.262409,6532.19636 L165.705379,6524.36583 C165.315635,6523.96094 164.683051,6523.96094 164.292308,6524.36583" />
          </g>
        </g>
      </g>
    </svg>
  );
};

export const MenuDots: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => {
  return (
    <svg
      fill="currentColor"
      width={width}
      height={height}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M29,16c0,1.104-0.896,2-2,2H11c-1.104,0-2-0.896-2-2s0.896-2,2-2h16C28.104,14,29,14.896,29,16z" />
      <path d="M29,6c0,1.104-0.896,2-2,2H11C9.896,8,9,7.104,9,6s0.896-2,2-2h16C28.104,4,29,4.896,29,6z" />
      <path d="M29,26c0,1.104-0.896,2-2,2H11c-1.104,0-2-0.896-2-2s0.896-2,2-2h16C28.104,24,29,24.896,29,26z" />
      <path d="M3,6c0,1.103,0.897,2,2,2s2-0.897,2-2S6.103,4,5,4S3,4.897,3,6z" />
      <path d="M3,16c0,1.103,0.897,2,2,2s2-0.897,2-2s-0.897-2-2-2S3,14.897,3,16z" />
      <path d="M3,26c0,1.103,0.897,2,2,2s2-0.897,2-2s-0.897-2-2-2S3,24.897,3,26z" />
    </svg>
  );
};

export const CircleDot: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
    >
      <path d="M8 3a5 5 0 100 10A5 5 0 008 3z" />
    </svg>
  );
};

export const DownloadCloud: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 12V19M12 19L9.75 16.6667M12 19L14.25 16.6667M6.6 17.8333C4.61178 17.8333 3 16.1917 3 14.1667C3 12.498 4.09438 11.0897 5.59198 10.6457C5.65562 10.6268 5.7 10.5675 5.7 10.5C5.7 7.46243 8.11766 5 11.1 5C14.0823 5 16.5 7.46243 16.5 10.5C16.5 10.5582 16.5536 10.6014 16.6094 10.5887C16.8638 10.5306 17.1284 10.5 17.4 10.5C19.3882 10.5 21 12.1416 21 14.1667C21 16.1917 19.3882 17.8333 17.4 17.8333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};


export const SearchIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const PlusCircle: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 32 32"
    // xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M16 29C9.37258 29 4 23.6274 4 17C4 10.3726 9.37258 5 16 5C22.6274 5 28 10.3726 28 17C28 23.6274 22.6274 29 16 29ZM16 3C8.26801 3 2 9.26801 2 17C2 24.732 8.26801 31 16 31C23.732 31 30 24.732 30 17C30 9.26801 23.732 3 16 3ZM22 16H17V11C17 10.4477 16.5523 10 16 10C15.4477 10 15 10.4477 15 11V16H10C9.44772 16 9 16.4477 9 17C9 17.5523 9.44772 18 10 18H15V23C15 23.5523 15.4477 24 16 24C16.5523 24 17 23.5523 17 23V18H22C22.5523 18 23 17.5523 23 17C23 16.4477 22.5523 16 22 16Z" />
  </svg>
);

export const Gift: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  className = "",
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    // xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.5 7.75H18.1C18.5 7.27 18.75 6.67 18.75 6C18.75 4.48 17.52 3.25 16 3.25C14.32 3.25 12.84 4.14 12 5.46C11.16 4.14 9.68 3.25 8 3.25C6.48 3.25 5.25 4.48 5.25 6C5.25 6.67 5.5 7.27 5.9 7.75H4.5C3.81 7.75 3.25 8.31 3.25 9V11.5C3.25 12.1 3.68 12.58 4.25 12.7V19.5C4.25 20.19 4.81 20.75 5.5 20.75H18.5C19.19 20.75 19.75 20.19 19.75 19.5V12.7C20.32 12.58 20.75 12.1 20.75 11.5V9C20.75 8.31 20.19 7.75 19.5 7.75ZM19.25 11.25H12.75V9.25H19.25V11.25ZM16 4.75C16.69 4.75 17.25 5.31 17.25 6C17.25 6.69 16.69 7.25 16 7.25H12.84C13.18 5.82 14.47 4.75 16 4.75ZM8 4.75C9.53 4.75 10.82 5.82 11.16 7.25H8C7.31 7.25 6.75 6.69 6.75 6C6.75 5.31 7.31 4.75 8 4.75ZM4.75 9.25H11.25V11.25H4.75V9.25ZM5.75 12.75H11.25V19.25H5.75V12.75ZM18.25 19.25H12.75V12.75H18.25V19.25Z" />
  </svg>
);