echo "VERCEL_ENV: $VERCEL_ENV";
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [ $VERCEL_ENV = "production" ]; then
    git fetch origin main && git diff --quiet origin/main...HEAD -- packages/webapp || exit 1;
    elif [ "$VERCEL_GIT_COMMIT_REF" = "staging" ]; then
    exit 1
else
    exit 0
fi