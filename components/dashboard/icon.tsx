"use client";

import { useEffect, useRef } from "react";
import { AlarmClockIcon } from "@/components/ui/alarm-clock";
import { ArchiveIcon } from "@/components/ui/archive";
import { ArrowRightIcon } from "@/components/ui/arrow-right";
import { BadgeAlertIcon } from "@/components/ui/badge-alert";
import { BadgePercentIcon } from "@/components/ui/badge-percent";
import { BanIcon } from "@/components/ui/ban";
import { BellIcon } from "@/components/ui/bell";
import { BookmarkCheckIcon } from "@/components/ui/bookmark-check";
import { BookmarkMinusIcon } from "@/components/ui/bookmark-minus";
import { BookmarkIcon } from "@/components/ui/bookmark";
import { BoxIcon } from "@/components/ui/box";
import { BoxesIcon } from "@/components/ui/boxes";
import { CalendarCheck2Icon } from "@/components/ui/calendar-check-2";
import { CalendarDaysIcon } from "@/components/ui/calendar-days";
import { ChartColumnIncreasingIcon } from "@/components/ui/chart-column-increasing";
import { GaugeIcon } from "@/components/ui/gauge";
import { CartIcon } from "@/components/ui/cart";
import { CheckCheckIcon } from "@/components/ui/check-check";
import { CheckIcon } from "@/components/ui/check";
import { ChevronDownIcon } from "@/components/ui/chevron-down";
import { ChevronLeftIcon } from "@/components/ui/chevron-left";
import { ChevronRightIcon } from "@/components/ui/chevron-right";
import { ChevronUpIcon } from "@/components/ui/chevron-up";
import { ChevronsLeftRightIcon } from "@/components/ui/chevrons-left-right";
import { CircleCheckIcon } from "@/components/ui/circle-check";
import { CircleDollarSignIcon } from "@/components/ui/circle-dollar-sign";
import { CircleGaugeIcon } from "@/components/ui/circle-gauge";
import { ClipboardCheckIcon } from "@/components/ui/clipboard-check";
import { ClockIcon } from "@/components/ui/clock";
import { CopyIcon } from "@/components/ui/copy";
import { DeleteIcon } from "@/components/ui/delete";
import { DownloadIcon } from "@/components/ui/download";
import { EyeOffIcon } from "@/components/ui/eye-off";
import { EyeIcon } from "@/components/ui/eye";
import { FileChartLineIcon } from "@/components/ui/file-chart-line";
import { FilePenLineIcon } from "@/components/ui/file-pen-line";
import { FileTextIcon } from "@/components/ui/file-text";
import { FlameIcon } from "@/components/ui/flame";
import { HandCoinsIcon } from "@/components/ui/hand-coins";
import { HardDriveDownloadIcon } from "@/components/ui/hard-drive-download";
import { HistoryIcon } from "@/components/ui/history";
import { HourglassIcon } from "@/components/ui/hourglass";
import { KeyIcon } from "@/components/ui/key";
import { LayersIcon } from "@/components/ui/layers";
import { LayoutGridIcon } from "@/components/ui/layout-grid";
import { LockIcon } from "@/components/ui/lock";
import { LogInIcon } from "@/components/ui/login";
import { LogoutIcon } from "@/components/ui/logout";
import { MailCheckIcon } from "@/components/ui/mail-check";
import { MapPinIcon } from "@/components/ui/map-pin";
import { MessageCircleIcon } from "@/components/ui/message-circle";
import { MessageSquareMoreIcon } from "@/components/ui/message-square-more";
import { MessageSquareXIcon } from "@/components/ui/message-square-x";
import { PanelLeftCloseIcon } from "@/components/ui/panel-left-close";
import { PanelLeftOpenIcon } from "@/components/ui/panel-left-open";
import { PhoneIcon } from "@/components/ui/phone";
import { PlusIcon } from "@/components/ui/plus";
import { ReceiptTextIcon } from "@/components/ui/receipt-text";
import { SearchIcon } from "@/components/ui/search";
import { SendIcon } from "@/components/ui/send";
import { SettingsIcon } from "@/components/ui/settings";
import { SparklesIcon } from "@/components/ui/sparkles";
import { SquareArrowRightIcon } from "@/components/ui/square-arrow-right";
import { TrendingDownIcon } from "@/components/ui/trending-down";
import { TrendingUpIcon } from "@/components/ui/trending-up";
import { TruckIcon } from "@/components/ui/truck";
import { UploadIcon } from "@/components/ui/upload";
import { UserCheckIcon } from "@/components/ui/user-check";
import { UserPlusIcon } from "@/components/ui/user-plus";
import { UserRoundCheckIcon } from "@/components/ui/user-round-check";
import { UserRoundCogIcon } from "@/components/ui/user-round-cog";
import { UsersRoundIcon } from "@/components/ui/users-round";
import { WalletIcon } from "@/components/ui/wallet";
import { ZapIcon } from "@/components/ui/zap";
import { cn } from "@/lib/utils";

/** lucide-animated icons (same family as the landing page CTAs), addressed by name so server pages can use them too. */
const icons = {
  "alarm-clock": AlarmClockIcon,
  "archive": ArchiveIcon,
  "arrow-right": ArrowRightIcon,
  "badge-alert": BadgeAlertIcon,
  "badge-percent": BadgePercentIcon,
  "ban": BanIcon,
  "bell": BellIcon,
  "bookmark-check": BookmarkCheckIcon,
  "bookmark-minus": BookmarkMinusIcon,
  "bookmark": BookmarkIcon,
  "box": BoxIcon,
  "boxes": BoxesIcon,
  "calendar-check-2": CalendarCheck2Icon,
  "calendar-days": CalendarDaysIcon,
  "chart-column-increasing": ChartColumnIncreasingIcon,
  gauge: GaugeIcon,
  "cart": CartIcon,
  "check-check": CheckCheckIcon,
  "check": CheckIcon,
  "chevron-down": ChevronDownIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  "chevron-up": ChevronUpIcon,
  "chevrons-left-right": ChevronsLeftRightIcon,
  "circle-check": CircleCheckIcon,
  "circle-dollar-sign": CircleDollarSignIcon,
  "circle-gauge": CircleGaugeIcon,
  "clipboard-check": ClipboardCheckIcon,
  "clock": ClockIcon,
  "copy": CopyIcon,
  "delete": DeleteIcon,
  "download": DownloadIcon,
  "eye-off": EyeOffIcon,
  "eye": EyeIcon,
  "file-chart-line": FileChartLineIcon,
  "file-pen-line": FilePenLineIcon,
  "file-text": FileTextIcon,
  "flame": FlameIcon,
  "hand-coins": HandCoinsIcon,
  "hard-drive-download": HardDriveDownloadIcon,
  "history": HistoryIcon,
  "hourglass": HourglassIcon,
  "key": KeyIcon,
  "layers": LayersIcon,
  "layout-grid": LayoutGridIcon,
  "lock": LockIcon,
  "login": LogInIcon,
  "logout": LogoutIcon,
  "mail-check": MailCheckIcon,
  "map-pin": MapPinIcon,
  "message-circle": MessageCircleIcon,
  "message-square-more": MessageSquareMoreIcon,
  "message-square-x": MessageSquareXIcon,
  "panel-left-close": PanelLeftCloseIcon,
  "panel-left-open": PanelLeftOpenIcon,
  "phone": PhoneIcon,
  "plus": PlusIcon,
  "receipt-text": ReceiptTextIcon,
  "search": SearchIcon,
  "send": SendIcon,
  "settings": SettingsIcon,
  "sparkles": SparklesIcon,
  "square-arrow-right": SquareArrowRightIcon,
  "trending-down": TrendingDownIcon,
  "trending-up": TrendingUpIcon,
  "truck": TruckIcon,
  "upload": UploadIcon,
  "user-check": UserCheckIcon,
  "user-plus": UserPlusIcon,
  "user-round-check": UserRoundCheckIcon,
  "user-round-cog": UserRoundCogIcon,
  "users-round": UsersRoundIcon,
  "wallet": WalletIcon,
  "zap": ZapIcon,
};
export type IconName = keyof typeof icons;
type Handle = { startAnimation: () => void; stopAnimation: () => void };

const px = (cls = "") => {
  const m = /(?:^|\s)size-(?:\[(\d+)px\]|(\d+(?:\.\d+)?))(?:\s|$)/.exec(cls);
  return m ? (m[1] ? Number(m[1]) : Number(m[2]) * 4) : 18;
};

/** Animated icon. It plays while the nearest button, link, label or `[data-anim]` card is hovered or focused; size comes from a `size-*` class. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const anim = useRef<Handle>(null);
  useEffect(() => {
    const el = host.current?.parentElement?.closest<HTMLElement>("a,button,label,[data-anim]") ?? host.current;
    if (!el) return;
    const on = () => anim.current?.startAnimation();
    const off = () => anim.current?.stopAnimation();
    const pairs = [["pointerenter", on], ["pointerleave", off], ["focusin", on], ["focusout", off]] as const;
    pairs.forEach(([e, f]) => el.addEventListener(e, f));
    return () => pairs.forEach(([e, f]) => el.removeEventListener(e, f));
  }, []);
  const C = icons[name];
  return (
    <span ref={host} aria-hidden className={cn("inline-grid shrink-0 place-items-center [&_svg]:overflow-visible", className)}>
      <C ref={anim} size={px(className)} />
    </span>
  );
}
