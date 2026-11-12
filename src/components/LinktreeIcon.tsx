interface LinktreeIconProps {
  size?: number;
  className?: string;
}

const LinktreeIcon = ({ size = 20, className }: LinktreeIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M13.736 5.853L17.708 1.6l2.802 2.664-4.172 4.05h5.928v3.844h-5.947l4.191 4.088-2.802 2.664-5.663-5.734-5.664 5.734-2.802-2.664 4.191-4.088H1.823V8.314H7.75L3.578 4.264 6.38 1.6l3.972 4.253V.146h3.384v5.707zm-3.384 12.415h3.384V24h-3.384v-5.732z" />
  </svg>
);

export default LinktreeIcon;
