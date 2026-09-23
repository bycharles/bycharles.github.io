window.STATISTICAL_METHODS = [
  {
    id: 'independent-vs-paired-samples', method_type: 'statistical', stat_category: 'concept',
    name: 'Independent vs. Paired Samples',
    summary: 'A study-design concept that determines whether observations should be analysed as unrelated groups or linked pairs.',
    claim: 'Are measurements from different observational units, or is there a defensible one-to-one link between them?',
    suitable: 'Use before choosing any two-group or repeated-measures test. Pairing may come from repeated measurements on the same participant or from a pre-specified matched design.',
    misuse: 'Treating two columns as paired simply because they have the same length, or ignoring participant-level pairing in a within-subject design.',
    alternative: 'If observations are clustered rather than paired, consider multilevel or mixed-effects models.',
    evidence: ['Study design', 'Independence', 'Pairing'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'NIST/SEMATECH. Analysis of paired observations. https://www.itl.nist.gov/div898/handbook/prc/section3/prc311.htm',
    method_source: 'NIST/SEMATECH e-Handbook of Statistical Methods: Two-Sample t-Test for Equal Means. https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm',
    stat_details: {
      purpose: 'Study-design decision', outcome_type: 'Any', group_count: 'Two conditions or groups', sample_relationship: 'Independent, paired, or matched',
      assumptions: 'Pairing must be defined by the study design and each observation should belong to no more than one valid pair.',
      hypotheses: 'This is a design concept rather than a hypothesis test.',
      reporting: 'State the unit of analysis, who or what was paired, and how the pairing was established.',
      interpretation: 'Independent groups require between-group methods; paired measurements require methods based on within-pair differences.',
      worked_example: 'Two different participant groups use designs A and B → independent. The same participants use both designs → paired.'
    }
  },
  {
    id: 'independent-samples-t-test', method_type: 'statistical', stat_category: 'two-group',
    name: 'Independent-samples t-test',
    summary: 'Compares the means of a continuous outcome between two independent groups.',
    claim: 'Do two independent populations differ in their mean outcome?',
    suitable: 'Use for a continuous outcome measured once per independent unit. Welch’s t-test is generally preferable when equal variances are not defensible.',
    misuse: 'Using it for repeated measures, choosing the pooled-variance version without checking the design, or reporting only p without an effect estimate and confidence interval.',
    alternative: 'Mann–Whitney U for an ordinal or rank-based estimand; Welch’s t-test for unequal variances; regression for covariate adjustment.',
    evidence: ['Mean difference', 'Independent groups', 'Continuous outcome'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Welch, B. L. (1947). The generalization of Student’s problem when several different population variances are involved. Biometrika, 34, 28–35. https://doi.org/10.1093/biomet/34.1-2.28',
    method_source: 'NIST/SEMATECH e-Handbook: Two-Sample t-Test for Equal Means. https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm',
    stat_details: {
      purpose: 'Compare two independent groups', outcome_type: 'Continuous', group_count: 'Two', sample_relationship: 'Independent',
      assumptions: 'Independent observations; a meaningful mean; approximately normal sampling distribution of the mean. The pooled test additionally assumes equal variances.',
      hypotheses: 'H₀: μ₁ − μ₂ = 0. H₁: μ₁ − μ₂ differs from the pre-specified null value.',
      reporting: 'Group n, mean and SD; mean difference with 95% CI; t, degrees of freedom, p; and an effect size such as Hedges’ g.',
      interpretation: 'The confidence interval describes plausible values for the population mean difference. Statistical significance is not practical importance.',
      worked_example: 'Compare task-completion time between separate groups assigned to interface A or interface B.'
    }
  },
  {
    id: 'paired-samples-t-test', method_type: 'statistical', stat_category: 'two-group',
    name: 'Paired-samples t-test',
    summary: 'Tests whether the mean within-pair difference is zero.',
    claim: 'Is the average change or within-participant difference different from zero?',
    suitable: 'Use when the same units are measured twice or when a defensible matched-pair design creates one-to-one correspondence.',
    misuse: 'Testing the two condition columns as if independent, checking normality separately for each condition instead of examining the paired differences, or breaking pairs with missing data without explanation.',
    alternative: 'Wilcoxon signed-rank for a rank-based paired comparison; sign test for a median-direction question; mixed-effects models for more complex repeated measures.',
    evidence: ['Mean change', 'Paired samples', 'Continuous outcome'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Student. (1908). The probable error of a mean. Biometrika, 6(1), 1–25. https://doi.org/10.2307/2331554',
    method_source: 'NIST/SEMATECH e-Handbook: Analysis of paired observations. https://www.itl.nist.gov/div898/handbook/prc/section3/prc311.htm',
    stat_details: {
      purpose: 'Compare two paired conditions', outcome_type: 'Continuous', group_count: 'Two', sample_relationship: 'Paired or matched',
      assumptions: 'Valid one-to-one pairs; independence between pairs; approximately normal distribution of within-pair differences for small samples.',
      hypotheses: 'H₀: mean paired difference μd = 0. H₁: μd differs from the pre-specified null value.',
      reporting: 'Number of complete pairs; mean and SD of the differences; mean difference with 95% CI; t, df, p; paired effect size.',
      interpretation: 'The test concerns the mean of the pairwise differences—not the difference between two unrelated group means.',
      worked_example: 'The same participants complete a visualization task before and after training.'
    }
  },
  {
    id: 'mann-whitney-u-test', method_type: 'statistical', stat_category: 'two-group',
    name: 'Mann–Whitney U test',
    summary: 'A rank-based test for comparing two independent distributions.',
    claim: 'Does one independent population tend to produce larger observations than the other?',
    suitable: 'Use for two independent groups when the outcome is ordinal or the scientific estimand is a rank-based probability of superiority.',
    misuse: 'Calling it a test of medians without comparable distribution shapes, using it for paired data, or treating it as an automatic response to a failed normality test.',
    alternative: 'Independent-samples t-test for a mean difference; permutation tests for a chosen statistic; ordinal regression for adjusted analysis.',
    evidence: ['Ranks', 'Independent groups', 'Probability of superiority'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Mann, H. B., & Whitney, D. R. (1947). On a test of whether one of two random variables is stochastically larger than the other. Annals of Mathematical Statistics, 18(1), 50–60. https://doi.org/10.1214/aoms/1177730491',
    method_source: 'NIST/SEMATECH e-Handbook: Do two arbitrary processes have the same central tendency? https://www.itl.nist.gov/div898/handbook/prc/section3/prc35.htm',
    stat_details: {
      purpose: 'Compare two independent distributions', outcome_type: 'Ordinal or continuous', group_count: 'Two', sample_relationship: 'Independent',
      assumptions: 'Independent observations; an ordinal or continuous outcome; pre-specified handling of ties. A median-shift interpretation needs similarly shaped distributions.',
      hypotheses: 'The general null concerns equality of distributions; a common effect measure is P(X > Y) plus half the probability of ties.',
      reporting: 'Group n and descriptive distributions; U, exact/asymptotic p; rank-biserial correlation or probability of superiority with CI when possible.',
      interpretation: 'A significant result supports a distributional ordering, not automatically a difference in means or medians.',
      worked_example: 'Compare 7-point usability ratings from two separate participant groups.'
    }
  },
  {
    id: 'wilcoxon-signed-rank-test', method_type: 'statistical', stat_category: 'two-group',
    name: 'Wilcoxon signed-rank test',
    summary: 'A rank-based test of paired differences that uses both their direction and magnitude ranking.',
    claim: 'Are paired differences symmetrically centred around zero?',
    suitable: 'Use for paired ordinal or continuous measurements when a signed-rank estimand is appropriate and the difference distribution is reasonably symmetric.',
    misuse: 'Confusing it with the Mann–Whitney rank-sum test, applying it to independent samples, or describing it as assumption-free.',
    alternative: 'Paired-samples t-test for a mean difference; sign test when symmetry is untenable; mixed-effects models for incomplete or multilevel repeated data.',
    evidence: ['Signed ranks', 'Paired samples', 'Ordinal outcome'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Wilcoxon, F. (1945). Individual comparisons by ranking methods. Biometrics Bulletin, 1(6), 80–83. https://doi.org/10.2307/3001968',
    method_source: 'NIST/SEMATECH Dataplot: Signed Rank Test. https://www.itl.nist.gov/div898/software/dataplot/refman1/auxillar/signrank.htm',
    stat_details: {
      purpose: 'Compare two paired conditions', outcome_type: 'Ordinal or continuous', group_count: 'Two', sample_relationship: 'Paired or matched',
      assumptions: 'Valid pairs; independence between pairs; differences can be ranked; symmetric difference distribution for a location-shift interpretation.',
      hypotheses: 'Under a symmetric location model, H₀ states that the centre of paired differences is zero.',
      reporting: 'Complete pairs; median and distribution of differences; signed-rank statistic, p; handling of zeros/ties; matched-pairs rank-biserial effect size.',
      interpretation: 'The test evaluates signed ranks of within-pair differences and is not the paired version of Mann–Whitney U.',
      worked_example: 'The same participants rate perceived workload for interfaces A and B.'
    }
  },
  {
    id: 'one-way-anova', method_type: 'statistical', stat_category: 'multi-group',
    name: 'One-way ANOVA',
    summary: 'Tests whether the population means of three or more independent groups are all equal.',
    claim: 'Does a categorical factor explain variation in a continuous outcome across independent groups?',
    suitable: 'Use for one categorical factor with independent groups and a continuous outcome. Follow an omnibus result with planned contrasts or multiplicity-controlled comparisons.',
    misuse: 'Interpreting the omnibus test as showing which groups differ, running many uncorrected t-tests, or ignoring unequal variances and influential observations.',
    alternative: 'Welch ANOVA for unequal variances; Kruskal–Wallis for a rank-based estimand; regression for equivalent and extended models.',
    evidence: ['Mean differences', 'Independent groups', 'Three or more groups'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Fisher, R. A. (1925). Statistical Methods for Research Workers. Oliver and Boyd. https://archive.org/details/statisticalmethoe7fish',
    method_source: 'NIST/SEMATECH e-Handbook: One-way ANOVA. https://www.itl.nist.gov/div898/handbook/prc/section4/prc433.htm',
    stat_details: {
      purpose: 'Compare three or more independent means', outcome_type: 'Continuous', group_count: 'Three or more', sample_relationship: 'Independent',
      assumptions: 'Independent observations; approximately normal residuals; equal variances for classical ANOVA; a meaningful mean.',
      hypotheses: 'H₀: all population means are equal. H₁: at least one mean differs.',
      reporting: 'Group n, mean and SD; F, numerator/denominator df, p; effect size with CI; planned contrasts or corrected post-hoc comparisons.',
      interpretation: 'A significant omnibus F does not identify which groups differ or establish practical importance.',
      worked_example: 'Compare completion time among three independent interface-design groups.'
    }
  },
  {
    id: 'repeated-measures-anova', method_type: 'statistical', stat_category: 'multi-group',
    name: 'Repeated-measures ANOVA',
    summary: 'Compares means across three or more conditions measured on the same observational units.',
    claim: 'Do mean outcomes differ across repeated conditions or time points?',
    suitable: 'Use for a balanced within-subject factor with a continuous outcome when covariance assumptions are defensible.',
    misuse: 'Treating repeated observations as independent, ignoring sphericity, or using listwise deletion without discussing missing repeated measurements.',
    alternative: 'Friedman test for a rank-based repeated comparison; linear mixed-effects models for missing, irregular, or multilevel repeated data.',
    evidence: ['Repeated measures', 'Mean differences', 'Three or more conditions'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Greenhouse, S. W., & Geisser, S. (1959). On methods in the analysis of profile data. Psychometrika, 24, 95–112. https://doi.org/10.1007/BF02289823',
    method_source: 'NIST/SEMATECH e-Handbook: Full factorial designs and analysis of variance. https://www.itl.nist.gov/div898/handbook/pri/section5/pri531.htm',
    stat_details: {
      purpose: 'Compare three or more paired means', outcome_type: 'Continuous', group_count: 'Three or more', sample_relationship: 'Repeated measures',
      assumptions: 'Independent participants; approximately normal residuals/differences; sphericity for univariate repeated-measures F tests with more than two levels.',
      hypotheses: 'H₀: all repeated-condition population means are equal.',
      reporting: 'Condition descriptives; F, corrected df and p when needed; sphericity assessment/correction; effect size; corrected follow-up contrasts.',
      interpretation: 'The omnibus test indicates whether a condition effect exists; follow-up contrasts locate and quantify it.',
      worked_example: 'The same participants perform tasks with three visualization techniques.'
    }
  },
  {
    id: 'kruskal-wallis-test', method_type: 'statistical', stat_category: 'multi-group',
    name: 'Kruskal–Wallis test',
    summary: 'A rank-based omnibus test for three or more independent groups.',
    claim: 'Do independent groups come from the same distribution, or does at least one tend to differ?',
    suitable: 'Use for an ordinal or continuous outcome across three or more independent groups when a rank-based comparison matches the research question.',
    misuse: 'Calling it an ANOVA of medians without comparable shapes, using it for repeated measures, or identifying pairwise differences without corrected follow-up tests.',
    alternative: 'One-way or Welch ANOVA for mean comparisons; ordinal regression for covariate-adjusted ordinal outcomes.',
    evidence: ['Ranks', 'Independent groups', 'Three or more groups'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Kruskal, W. H., & Wallis, W. A. (1952). Use of ranks in one-criterion variance analysis. Journal of the American Statistical Association, 47(260), 583–621. https://doi.org/10.1080/01621459.1952.10483441',
    method_source: 'NIST/SEMATECH e-Handbook: Kruskal–Wallis test. https://www.itl.nist.gov/div898/handbook/prc/section4/prc41.htm',
    stat_details: {
      purpose: 'Compare three or more independent distributions', outcome_type: 'Ordinal or continuous', group_count: 'Three or more', sample_relationship: 'Independent',
      assumptions: 'Independent observations; rankable outcome; appropriately handled ties. A median interpretation requires similarly shaped distributions.',
      hypotheses: 'H₀: the group distributions are identical. H₁: at least one distribution differs.',
      reporting: 'Group n and distribution summaries; H, df, p; effect size; multiplicity-controlled pairwise follow-ups if justified.',
      interpretation: 'A significant omnibus result does not by itself identify the differing groups or imply a mean difference.',
      worked_example: 'Compare ordinal trust ratings across three separate experimental groups.'
    }
  },
  {
    id: 'friedman-test', method_type: 'statistical', stat_category: 'multi-group',
    name: 'Friedman test',
    summary: 'A rank-based omnibus test for three or more repeated or matched conditions.',
    claim: 'Do repeated conditions differ in their within-block rank distributions?',
    suitable: 'Use when the same participants or matched blocks contribute observations to three or more conditions and a rank-based analysis is appropriate.',
    misuse: 'Using it for independent groups, ignoring incomplete blocks, or claiming specific pairwise differences without corrected post-hoc comparisons.',
    alternative: 'Repeated-measures ANOVA for mean comparisons; mixed-effects or ordinal mixed models for incomplete and complex repeated data.',
    evidence: ['Ranks', 'Repeated measures', 'Three or more conditions'], analysis_modes: [], stage: [], category: 'statistical',
    reference_paper: 'Friedman, M. (1937). The use of ranks to avoid the assumption of normality implicit in the analysis of variance. Journal of the American Statistical Association, 32(200), 675–701. https://doi.org/10.1080/01621459.1937.10503522',
    method_source: 'NIST/SEMATECH Dataplot: Friedman Test. https://www.itl.nist.gov/div898/software/dataplot/refman1/auxillar/friedman.htm',
    stat_details: {
      purpose: 'Compare three or more paired conditions', outcome_type: 'Ordinal or continuous', group_count: 'Three or more', sample_relationship: 'Repeated measures or matched blocks',
      assumptions: 'Independent blocks/participants; mutually comparable repeated conditions; rankable outcomes; conventional implementation expects complete blocks.',
      hypotheses: 'H₀: condition rank distributions are equal within blocks.',
      reporting: 'Number of complete blocks; condition median/rank summaries; Friedman statistic, df, p; Kendall’s W; corrected pairwise follow-ups.',
      interpretation: 'A significant result indicates a condition difference somewhere, not which conditions differ.',
      worked_example: 'The same participants rate three dashboard designs on a 7-point scale.'
    }
  }
];
