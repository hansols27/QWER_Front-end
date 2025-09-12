"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

// MUI 아이콘
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import AlbumIcon from "@mui/icons-material/Album";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import EventIcon from "@mui/icons-material/Event";
import NotificationsIcon from "@mui/icons-material/Notifications";

const menuItems = [
  { text: "기본설정", path: "/settings", icon: <SettingsIcon /> },
  { text: "프로필", path: "/profile", icon: <PersonIcon /> },
  { text: "앨범", path: "/album", icon: <AlbumIcon /> },
  { text: "갤러리", path: "/gallery", icon: <PhotoLibraryIcon /> },
  { text: "일정관리", path: "/schedule", icon: <EventIcon /> },
  { text: "공지사항", path: "/notice", icon: <NotificationsIcon /> },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap>
          Admin
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            href={item.path}
            selected={pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
