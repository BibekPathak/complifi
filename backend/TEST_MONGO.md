# Test MongoDB Connection

Run these commands to test if MongoDB is working:

## Check if MongoDB is running

```bash
docker ps | grep mongo
```

Should show `complifi-mongo` container.

## Test MongoDB directly

```bash
docker exec -it complifi-mongo mongosh
```

If this works, MongoDB is running correctly.

## Test from backend

Check the backend console output:

**Good:**
```
MongoDB connected
```

**Bad:**
```
MongoDB connection error: ...
```

## If MongoDB not running

Start it:
```bash
docker start complifi-mongo
```

Or create new:
```bash
docker run -d --name complifi-mongo -p 27017:27017 mongo:latest
```

