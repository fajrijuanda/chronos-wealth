type NavbarSessionInfoProps = {
  sessionEmail: string | null;
};

export function NavbarSessionInfo({ sessionEmail }: NavbarSessionInfoProps) {
  return (
    <div className="hidden md:flex flex-col items-end leading-tight">
      <span className="text-[11px] text-muted-foreground">Logged in as</span>
      <span className="text-xs font-medium text-foreground max-w-44 truncate">
        {sessionEmail ?? "-"}
      </span>
    </div>
  );
}
