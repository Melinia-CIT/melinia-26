import { SESClient } from "@aws-sdk/client-ses";
import { getEnv } from "./lib";

export const ses = new SESClient({
	region: "ap-south-1",
	credentials: {
		accessKeyId: getEnv("AWS_ACCESS_KEY"),
		secretAccessKey: getEnv("AWS_SECRET_KEY")
	}
});
