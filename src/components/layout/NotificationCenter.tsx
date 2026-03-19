"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Eye,
  Handshake,
  Info,
  Landmark,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteAllNotifications,
  deleteNotification as deleteNotificationAction,
  markAllNotificationsAsRead,
  markNotificationAsRead as markNotificationAsReadAction,
} from "@/actions/notification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NotificationType = "SYSTEM" | "FINANCE" | "COLLABORATION" | "SOCIAL";
type NotificationPriority = "LOW" | "MEDIUM" | "HIGH";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  createdAt: string;
  readAt: string | null;
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate).getTime();
  if (Number.isNaN(date)) return "baru saja";
  const diffMinutes = Math.max(1, Math.floor((Date.now() - date) / (1000 * 60)));

  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function getTypeIcon(type: NotificationType) {
  if (type === "COLLABORATION") return Handshake;
  if (type === "FINANCE") return Landmark;
  if (type === "SOCIAL") return Users;
  return Sparkles;
}

function getPriorityMeta(priority: NotificationPriority) {
  if (priority === "HIGH") {
    return {
      badge: "High",
      badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300",
      dotClass: "bg-rose-500",
      Icon: AlertTriangle,
    };
  }

  if (priority === "LOW") {
    return {
      badge: "Low",
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
      Icon: Info,
    };
  }

  return {
    badge: "Medium",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
    dotClass: "bg-amber-500",
    Icon: Info,
  };
}

export function NotificationCenter({
  sessionEmail,
  initialNotifications,
}: {
  sessionEmail: string;
  initialNotifications: Array<{
    id: string;
    title: string;
    body: string;
    href: string | null;
    type: NotificationType;
    priority: NotificationPriority;
    createdAt: Date;
    readAt: Date | null;
  }>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialNotifications.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      readAt: item.readAt ? item.readAt.toISOString() : null,
    })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [leavingIds, setLeavingIds] = useState<Record<string, boolean>>({});
  const [highlightIds, setHighlightIds] = useState<Record<string, boolean>>({});

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  const selectedNotification = useMemo(
    () => notifications.find((item) => item.id === selectedId) ?? null,
    [notifications, selectedId],
  );

  const filteredNotifications = useMemo(
    () => notifications.filter((item) => (filter === "unread" ? !item.readAt : true)),
    [filter, notifications],
  );

  const markAsRead = (id: string) => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, readAt: nowIso } : item)));
    setHighlightIds((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setHighlightIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 280);

    if (sessionEmail) {
      startTransition(async () => {
        await markNotificationAsReadAction(id, sessionEmail);
      });
    }
  };

  const deleteNotification = (id: string) => {
    setLeavingIds((prev) => ({ ...prev, [id]: true }));

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setLeavingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSelectedId((current) => (current === id ? null : current));
      setPreviewOpen(false);
    }, 210);

    if (sessionEmail) {
      startTransition(async () => {
        await deleteNotificationAction(id, sessionEmail);
      });
    }
  };

  const openPreview = (id: string) => {
    setSelectedId(id);
    markAsRead(id);
    setOpen(false);
    setPreviewOpen(true);
  };

  const markAllRead = () => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: nowIso })));

    if (sessionEmail) {
      startTransition(async () => {
        await markAllNotificationsAsRead(sessionEmail);
      });
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setSelectedId(null);
    setPreviewOpen(false);

    if (sessionEmail) {
      startTransition(async () => {
        await deleteAllNotifications(sessionEmail);
      });
    }
  };

  const goToRelatedPage = () => {
    if (!selectedNotification) return;
    markAsRead(selectedNotification.id);
    setPreviewOpen(false);
    setOpen(false);
    router.push(selectedNotification.href ?? "/overview");
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-90 rounded-2xl p-0">
          <div className="border-b border-border/75 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={filter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 rounded-xl"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={filter === "unread" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 rounded-xl"
                  onClick={() => setFilter("unread")}
                >
                  Unread
                </Button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg text-xs" onClick={markAllRead}>
                Tandai semua dilihat
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg text-xs text-rose-500" onClick={clearAll}>
                Hapus semua
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {filteredNotifications.length === 0 ? (
              <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-border/70 text-sm text-muted-foreground">
                Tidak ada notifikasi.
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openPreview(item.id)}
                  className={`mb-1 flex w-full flex-col items-start gap-1 rounded-xl border border-transparent px-3 py-2 text-left transition-all duration-200 hover:border-border/70 hover:bg-accent/40 ${
                    leavingIds[item.id] ? "translate-x-5 opacity-0" : "translate-x-0 opacity-100"
                  } ${highlightIds[item.id] ? "bg-sky-50/70 dark:bg-sky-900/20" : ""}`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const TypeIcon = getTypeIcon(item.type);
                        return <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />;
                      })()}
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                    </div>
                    {!item.readAt ? <span className="size-2 rounded-full bg-sky-500" aria-hidden="true" /> : null}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-lg px-2 py-0 text-[10px] font-medium uppercase tracking-wide">
                      {item.type.toLowerCase()}
                    </Badge>
                    {(() => {
                      const priority = getPriorityMeta(item.priority);
                      const PriorityIcon = priority.Icon;
                      return (
                        <Badge className={`rounded-lg px-2 py-0 text-[10px] font-medium ${priority.badgeClass}`}>
                          <PriorityIcon className="mr-1 h-3 w-3" />
                          {priority.badge}
                        </Badge>
                      );
                    })()}
                    <span className="text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title ?? "Notification"}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.body ?? "Pilih notifikasi untuk melihat detail."}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification ? (
            <div className="rounded-2xl border border-border/70 bg-card/55 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-lg px-2 py-0 text-[10px] font-medium uppercase tracking-wide">
                  {selectedNotification.type.toLowerCase()}
                </Badge>
                {(() => {
                  const priority = getPriorityMeta(selectedNotification.priority);
                  return (
                    <Badge className={`rounded-lg px-2 py-0 text-[10px] font-medium ${priority.badgeClass}`}>
                      <span className={`mr-1 size-1.5 rounded-full ${priority.dotClass}`} />
                      {priority.badge}
                    </Badge>
                  );
                })()}
                <span className="text-xs">{formatRelativeTime(selectedNotification.createdAt)}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{selectedNotification.body}</p>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => selectedNotification && markAsRead(selectedNotification.id)}
                disabled={!selectedNotification}
              >
                <Eye className="mr-2 h-4 w-4" />
                Tandai Dilihat
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-rose-500 hover:text-rose-600"
                onClick={() => selectedNotification && deleteNotification(selectedNotification.id)}
                disabled={!selectedNotification}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </div>
            <Button type="button" className="rounded-xl" onClick={goToRelatedPage} disabled={!selectedNotification}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Buka Halaman Terkait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
