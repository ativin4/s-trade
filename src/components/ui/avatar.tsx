export { Avatar } from "@mui/material";
export type { AvatarProps } from "@mui/material";
// The MUI Avatar has a different API.
// You pass the image url to the `src` prop, and any fallback content as children.
//
// Example:
// <Avatar src="/path/to/image.jpg">
//   Fallback text
// </Avatar>
//
// The following components are exported for API compatibility during migration.
// They don't do anything.

const AvatarImage = (props: { src: string }) => null;
const AvatarFallback = ({ children }: { children: React.ReactNode }) => <>{children}</>;


export { AvatarImage, AvatarFallback };