import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import EdgeFunctionRequest, { RunParams } from "../_shared/EdgeFunctionRequest.ts";
import submitQuiz from "./submitQuiz.ts";
import { primaryKeyInt, array, object, naturalNumber, string, union } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
    const parameters: RunParams = {
        metaUrl: import.meta.url,
        req: req,
        schemaRecord: {
            quizAttemptId: primaryKeyInt(),
            responses: array(
                object({
                    questionId: primaryKeyInt(),
                    answer: union([naturalNumber(), string()])
                })
            )
        },
        endpointFunction: submitQuiz
    };

    return await EdgeFunctionRequest.run(parameters);
});
