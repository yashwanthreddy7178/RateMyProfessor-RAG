"use client";
import { Button, Container, CssBaseline, Paper, Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useRouter } from "next/navigation";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/chat"); // Assuming your chat page is at the "/chat" route
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          textAlign: "center",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography component="h1" variant="h3" gutterBottom>
            Rate My Professor
          </Typography>
          <Typography variant="h6" gutterBottom>
            Your go-to platform for rating and reviewing professors.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGetStarted}
            sx={{ mt: 3 }}
          >
            Get Started
          </Button>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
