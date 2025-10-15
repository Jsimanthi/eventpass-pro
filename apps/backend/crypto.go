package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"os"
)

func sign(data []byte) string {
	mac := hmac.New(sha256.New, []byte(os.Getenv("HMAC_SECRET")))
	mac.Write(data)
	return hex.EncodeToString(mac.Sum(nil))
}

func verify(data []byte, signature string) bool {
	expectedSignature := sign(data)
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}
