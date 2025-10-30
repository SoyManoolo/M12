import UserAvatar from "./UserAvatar";

interface PostHeaderProps {
  user: {
    user_id: string;
    username: string;
    profile_picture: string | null;
  };
  layout?: "horizontal" | "vertical";
}

/**
 * Componente para mostrar el header del post con info del usuario
 */
export default function PostHeader({ user, layout = "horizontal" }: PostHeaderProps) {
  const navigateToProfile = () => {
    window.location.href = `/perfil?username=${user.username}`;
  };

  if (layout === "vertical") {
    return (
      <div className="flex flex-col items-center space-y-2">
        <UserAvatar
          profilePicture={user.profile_picture}
          username={user.username}
          size="lg"
          onClick={navigateToProfile}
        />
        <p
          className="font-semibold text-white cursor-pointer hover:underline text-center text-sm"
          onClick={navigateToProfile}
        >
          {user.username}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <UserAvatar
        profilePicture={user.profile_picture}
        username={user.username}
        size="md"
        onClick={navigateToProfile}
      />
      <p
        className="font-semibold text-white cursor-pointer hover:underline text-base truncate flex-1"
        onClick={navigateToProfile}
      >
        {user.username}
      </p>
    </div>
  );
}
