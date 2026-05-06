export class GetActiveJobsQuery {
    constructor(
        // Queries can carry filter parameters.
        // Notice how clean this is — just the data needed to perform the read.
        public readonly location?: string,
        public readonly salaryMin?: number,
    ) { }
}