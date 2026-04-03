import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
    console.log(
        `health check is avaliable on http://localhost:${process.env.PORT}/health`,
    );
});
