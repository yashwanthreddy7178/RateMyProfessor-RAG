// "use client";
import { Box, Button, CircularProgress, Paper, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useState } from "react";

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

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages
    setLoading(true);
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      reader.read().then(function processText({ done, value }) {
        if (done) {
          setLoading(false);
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        return reader.read().then(processText);
      });
    } catch (error) {
      setLoading(false);
      console.error("Error fetching response:", error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="#f0f0f0"
      >
        <Paper
          elevation={6}
          sx={{
            width: isSmallScreen ? "90%" : "500px",
            height: isSmallScreen ? "80vh" : "700px",
            display: "flex",
            flexDirection: "column",
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Rate My Professor Support Assistant
          </Typography>
          <Stack
            direction={"column"}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "assistant" ? "flex-start" : "flex-end"
                }
              >
                <Paper
                  elevation={3}
                  sx={{
                    bgcolor:
                      message.role === "assistant"
                        ? "primary.main"
                        : "secondary.main",
                    color: "white",
                    borderRadius: 2,
                    p: 2,
                    maxWidth: "70%",
                  }}
                >
                  {message.content}
                </Paper>
              </Box>
            ))}
          </Stack>
          <Stack direction={"row"} spacing={2} mt={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              variant="outlined"
            />
            <Button variant="contained" onClick={sendMessage} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Send"}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
