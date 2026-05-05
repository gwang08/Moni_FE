export function ReportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      <path d="M15.25 3.25H4.75c-.825 0-1.5.675-1.5 1.5v10.5c0 .825.675 1.5 1.5 1.5h10.5c.825 0 1.5-.675 1.5-1.5V4.75c0-.825-.675-1.5-1.5-1.5Zm0 12H4.75V4.75h10.5v10.5Zm-9-6.75h1.5v5.25h-1.5V8.5Zm3-2.25h1.5v7.5h-1.5v-7.5Zm3 4.5h1.5v3h-1.5v-3Z" />
    </svg>
  );
}
