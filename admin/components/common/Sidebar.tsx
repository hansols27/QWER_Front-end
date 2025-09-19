import Link from "next/link";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import AlbumIcon from "@mui/icons-material/Album";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import EventIcon from "@mui/icons-material/Event";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/router";

const menuItems = [
  { text: "기본설정", path: "/settings", icon: <SettingsIcon /> },
  { text: "프로필", path: "/profile", icon: <PersonIcon /> },
  { text: "앨범", path: "/album", icon: <AlbumIcon /> },
  { text: "갤러리", path: "/gallery", icon: <PhotoLibraryIcon /> },
  { text: "일정관리", path: "/schedule", icon: <EventIcon /> },
  { text: "공지사항", path: "/notice", icon: <NotificationsIcon /> },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = router.pathname;

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error("로그아웃 실패");

      localStorage.removeItem("token");
      router.replace("/login"); // 로그아웃 시 로그인 페이지로 이동
    } catch (error) {
      console.error(error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box" },
      }}
    >
      <Toolbar>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          {/* 로고 이미지 */}
          <img src="/logo.svg" alt="로고" width={28} height={28} />

          {/* 텍스트 */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: "1.1rem", // 로고와 크기 맞춤
              letterSpacing: "0.5px",
            }}
          >
            QWER
          </Typography>
        </Box>
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
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="로그아웃" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
