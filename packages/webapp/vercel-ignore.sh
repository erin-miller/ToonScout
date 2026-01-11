echo "VERCEL_ENV: $VERCEL_ENV"

if [ "$VERCEL_ENV" = "production" ]; then
    git fetch origin main && git diff --quiet origin/main...HEAD -- packages/webapp || exit 1

elif [ "$VERCEL_ENV" = "preview" ]; then
    exit 1

else
    exit 0
fi
