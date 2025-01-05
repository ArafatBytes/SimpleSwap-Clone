import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { toast } from "react-hot-toast";

export default function ExchangeDialog({ open, onClose, exchange, onConfirm }) {
  const [exchangeStatus, setExchangeStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [payoutAddress, setPayoutAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);

  useEffect(() => {
    if (open && exchange) {
      console.log("Dialog opened with exchange:", exchange);
      setExchangeStatus("");
      setProgress(0);
      setPayoutAddress("");
      setError("");
      setShowPayoutInfo(false);
    }
  }, [open, exchange]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError("");

    try {
      const requestData = {
        exchangeId: exchange.id,
        getCurrency: exchange.originalCurrencyTo,
      };

      console.log("Sending request with data:", requestData);

      const response = await fetch("/api/admin/exchanges/complete-locked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Response from complete-locked:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create exchange");
      }

      console.log("Setting payout info:", {
        payoutAddress: data.address_from,
        usdtAmount: exchange.amount_to,
        exchangeId: data.id,
      });

      // Set the payout information
      setPayoutAddress(data.address_from);
      setShowPayoutInfo(true);

      // Start polling with the SimpleSwap exchange ID
      if (data.id) {
        console.log("Starting polling with SimpleSwap exchange ID:", data.id);
        startPolling(data.id);
      } else {
        console.error("No SimpleSwap exchange ID received from API");
        setError("Failed to get exchange ID");
      }

      onConfirm(data);
    } catch (error) {
      console.error("Complete exchange error:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const startPolling = async (exchangeId) => {
    const pollStatus = async () => {
      try {
        console.log("Polling status for exchange:", exchangeId);
        const response = await fetch(`/api/exchanges/${exchangeId}/status`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch status");
        }

        console.log("Received status:", data.status);
        setExchangeStatus(data.status);

        // Update progress based on status
        switch (data.status) {
          case "waiting":
            setProgress(20);
            break;
          case "confirming":
            setProgress(40);
            break;
          case "exchanging":
            setProgress(60);
            break;
          case "sending":
            setProgress(80);
            break;
          case "finished":
            setProgress(100);
            setIsLoading(false);
            break;
          case "failed":
            setError("Exchange failed");
            setIsLoading(false);
            break;
          default:
            // Keep current progress for unknown status
            break;
        }

        // Continue polling if exchange is not in a final state
        if (!["finished", "failed"].includes(data.status)) {
          setTimeout(pollStatus, 5000);
        }
      } catch (error) {
        console.error("Error polling status:", error);
        // Don't show error immediately, try again
        setTimeout(pollStatus, 5000);
      }
    };

    // Start polling
    pollStatus();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Locked Exchange</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Exchange Operation Details
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" gutterBottom>
              <strong>Original Request:</strong>
            </Typography>
            <Typography variant="body2" gutterBottom>
              User sent: {exchange?.amount_from}{" "}
              {exchange?.currency_from?.toUpperCase()}
            </Typography>
            <Typography variant="body2" gutterBottom>
              User requested: {exchange?.originalCurrencyTo?.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              To address: {exchange?.originalAddressTo}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" gutterBottom>
              <strong>Current Operation:</strong>
            </Typography>
            <Typography variant="body2" color="primary" gutterBottom>
              You will send: {exchange?.amount_to} USDT
            </Typography>
            <Typography variant="body2" gutterBottom>
              User will get: {exchange?.originalCurrencyTo?.toUpperCase()}{" "}
              (amount will be calculated at current rate)
            </Typography>
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {showPayoutInfo && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "primary.dark", borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom color="primary.contrastText">
              Payment Required
            </Typography>
            <Typography
              variant="body2"
              color="primary.contrastText"
              gutterBottom
            >
              Please send {exchange?.amount_to} USDT to:
            </Typography>
            <Box
              onClick={() => {
                navigator.clipboard.writeText(payoutAddress);
                toast.success("Address copied to clipboard!");
              }}
              sx={{
                cursor: "pointer",
                position: "relative",
                "&:hover": {
                  "& .copy-indicator": {
                    opacity: 1,
                  },
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  wordBreak: "break-all",
                  p: 1,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  fontFamily: "monospace",
                  transition: "background-color 0.2s",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                {payoutAddress}
              </Typography>
              <Typography
                className="copy-indicator"
                sx={{
                  position: "absolute",
                  right: 1,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: "0.75rem",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              >
                Click to copy
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="primary.contrastText"
              sx={{ mt: 1 }}
            >
              The exchange will begin processing once payment is received.
            </Typography>
          </Box>
        )}

        {isLoading && (
          <Box sx={{ width: "100%", mb: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Status: {exchangeStatus}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Close
        </Button>
        {!showPayoutInfo && (
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={isLoading}
          >
            Create Exchange
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
