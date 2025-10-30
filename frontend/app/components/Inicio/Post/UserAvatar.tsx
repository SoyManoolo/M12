import SecureImage from "~/components/Shared/SecureImage";

interface UserAvatarProps {
  profilePicture: string | null;
  username: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

/**
 * Componente reutilizable para mostrar el avatar de un usuario
 */
export default function UserAvatar({
  profilePicture,
  username,
  size = "md",
  onClick,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  const className = `${sizeClasses[size]} rounded-full cursor-pointer object-cover border-2 border-gray-800`;

  if (profilePicture) {
    return (
      <SecureImage
        src={profilePicture}
        alt={username}
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onClick}
    >
      <span className="text-gray-400 font-bold">
        {username.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
