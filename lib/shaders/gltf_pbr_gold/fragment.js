const shader=`precision mediump float;

struct BSDF { vec3 response; vec3 throughput; };
#define EDF vec3
struct surfaceshader { vec3 color; vec3 transparency; };
struct volumeshader { vec3 color; vec3 transparency; };
struct displacementshader { vec3 offset; float scale; };
struct lightshader { vec3 intensity; vec3 direction; };
#define material surfaceshader

// Uniform block: PublicUniforms
uniform surfaceshader backsurfaceshader;
uniform displacementshader displacementshader1;
uniform vec3 SR_gold_base_color;
uniform float SR_gold_metallic;
uniform float SR_gold_roughness;
uniform float SR_gold_occlusion;
uniform float SR_gold_transmission;
uniform float SR_gold_specular;
uniform vec3 SR_gold_specular_color;
uniform float SR_gold_ior;
uniform float SR_gold_alpha;
uniform int SR_gold_alpha_mode;
uniform float SR_gold_alpha_cutoff;
uniform float SR_gold_iridescence;
uniform float SR_gold_iridescence_ior;
uniform float SR_gold_iridescence_thickness;
uniform vec3 SR_gold_sheen_color;
uniform float SR_gold_sheen_roughness;
uniform float SR_gold_clearcoat;
uniform float SR_gold_clearcoat_roughness;
uniform vec3 SR_gold_emissive;
uniform float SR_gold_emissive_strength;
uniform float SR_gold_thickness;
uniform float SR_gold_attenuation_distance;
uniform vec3 SR_gold_attenuation_color;

// Uniform block: PrivateUniforms
uniform float u_alphaThreshold;
uniform mat4 u_envMatrix;
uniform sampler2D u_envRadiance;
uniform float u_envLightIntensity;
uniform int u_envRadianceMips;
uniform int u_envRadianceSamples;
uniform sampler2D u_envIrradiance;
uniform bool u_refractionTwoSided;
uniform vec3 u_viewPosition;
uniform int u_numActiveLightSources;

in vec3 normalWorld;
in vec3 tangentWorld;
in vec3 positionWorld;

// Pixel shader outputs
out vec4 out1;

#define M_FLOAT_EPS 1e-8

#define mx_mod mod
#define mx_inverse inverse
#define mx_inversesqrt inversesqrt
#define mx_sin sin
#define mx_cos cos
#define mx_tan tan
#define mx_asin asin
#define mx_acos acos
#define mx_atan atan
#define mx_radians radians

float mx_square(float x)
{
    return x*x;
}

vec2 mx_square(vec2 x)
{
    return x*x;
}

vec3 mx_square(vec3 x)
{
    return x*x;
}

vec3 mx_srgb_encode(vec3 color)
{
    bvec3 isAbove = greaterThan(color, vec3(0.0031308));
    vec3 linSeg = color * 12.92;
    vec3 powSeg = 1.055 * pow(max(color, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
    return mix(linSeg, powSeg, isAbove);
}

#define DIRECTIONAL_ALBEDO_METHOD 0

#define MAX_LIGHT_SOURCES 1
#define M_PI 3.1415926535897932
#define M_PI_INV (1.0 / M_PI)

float mx_pow5(float x)
{
    return mx_square(mx_square(x)) * x;
}

float mx_pow6(float x)
{
    float x2 = mx_square(x);
    return mx_square(x2) * x2;
}

// Standard Schlick Fresnel
float mx_fresnel_schlick(float cosTheta, float F0)
{
    float x = clamp(1.0 - cosTheta, 0.0, 1.0);
    float x5 = mx_pow5(x);
    return F0 + (1.0 - F0) * x5;
}
vec3 mx_fresnel_schlick(float cosTheta, vec3 F0)
{
    float x = clamp(1.0 - cosTheta, 0.0, 1.0);
    float x5 = mx_pow5(x);
    return F0 + (1.0 - F0) * x5;
}

// Generalized Schlick Fresnel
float mx_fresnel_schlick(float cosTheta, float F0, float F90)
{
    float x = clamp(1.0 - cosTheta, 0.0, 1.0);
    float x5 = mx_pow5(x);
    return mix(F0, F90, x5);
}
vec3 mx_fresnel_schlick(float cosTheta, vec3 F0, vec3 F90)
{
    float x = clamp(1.0 - cosTheta, 0.0, 1.0);
    float x5 = mx_pow5(x);
    return mix(F0, F90, x5);
}

// Generalized Schlick Fresnel with a variable exponent
float mx_fresnel_schlick(float cosTheta, float F0, float F90, float exponent)
{
    float x = clamp(1.0 - cosTheta, 0.0, 1.0);
    return mix(F0, F90, pow(x, exponent));
}
vec3 mx_fresnel_schlick(float cosTheta, vec3 F0, vec3 F90, float exponent)
{
    float x = clamp(1.0 - cosTheta, 0.0, 1.0);
    return mix(F0, F90, pow(x, exponent));
}

// Enforce that the given normal is forward-facing from the specified view direction.
vec3 mx_forward_facing_normal(vec3 N, vec3 V)
{
    return (dot(N, V) < 0.0) ? -N : N;
}

// https://www.graphics.rwth-aachen.de/publication/2/jgt.pdf
float mx_golden_ratio_sequence(int i)
{
    const float GOLDEN_RATIO = 1.6180339887498948;
    return fract((float(i) + 1.0) * GOLDEN_RATIO);
}

// https://people.irisa.fr/Ricardo.Marques/articles/2013/SF_CGF.pdf
vec2 mx_spherical_fibonacci(int i, int numSamples)
{
    return vec2((float(i) + 0.5) / float(numSamples), mx_golden_ratio_sequence(i));
}

// Generate a uniform-weighted sample on the unit hemisphere.
vec3 mx_uniform_sample_hemisphere(vec2 Xi)
{
    float phi = 2.0 * M_PI * Xi.x;
    float cosTheta = 1.0 - Xi.y;
    float sinTheta = sqrt(1.0 - mx_square(cosTheta));
    return vec3(mx_cos(phi) * sinTheta,
                mx_sin(phi) * sinTheta,
                cosTheta);
}

// Generate a cosine-weighted sample on the unit hemisphere.
vec3 mx_cosine_sample_hemisphere(vec2 Xi)
{
    float phi = 2.0 * M_PI * Xi.x;
    float cosTheta = sqrt(Xi.y);
    float sinTheta = sqrt(1.0 - Xi.y);
    return vec3(mx_cos(phi) * sinTheta,
                mx_sin(phi) * sinTheta,
                cosTheta);
}

// Construct an orthonormal basis from a unit vector.
// https://graphics.pixar.com/library/OrthonormalB/paper.pdf
mat3 mx_orthonormal_basis(vec3 N)
{
    float sign = (N.z < 0.0) ? -1.0 : 1.0;
    float a = -1.0 / (sign + N.z);
    float b = N.x * N.y * a;
    vec3 X = vec3(1.0 + sign * N.x * N.x * a, sign * b, -sign * N.x);
    vec3 Y = vec3(b, sign + N.y * N.y * a, -N.y);
    return mat3(X, Y, N);
}

const int FRESNEL_MODEL_DIELECTRIC = 0;
const int FRESNEL_MODEL_CONDUCTOR = 1;
const int FRESNEL_MODEL_SCHLICK = 2;

// Parameters for Fresnel calculations
struct FresnelData
{
    // Fresnel model
    int model;
    bool airy;

    // Physical Fresnel
    vec3 ior;
    vec3 extinction;

    // Generalized Schlick Fresnel
    vec3 F0;
    vec3 F82;
    vec3 F90;
    float exponent;

    // Thin film
    float tf_thickness;
    float tf_ior;

    // Refraction
    bool refraction;
};

// https://media.disneyanimation.com/uploads/production/publication_asset/48/asset/s2012_pbs_disney_brdf_notes_v3.pdf
// Appendix B.2 Equation 13
float mx_ggx_NDF(vec3 H, vec2 alpha)
{
    vec2 He = H.xy / alpha;
    float denom = dot(He, He) + mx_square(H.z);
    return 1.0 / (M_PI * alpha.x * alpha.y * mx_square(denom));
}

// https://ggx-research.github.io/publication/2023/06/09/publication-ggx.html
vec3 mx_ggx_importance_sample_VNDF(vec2 Xi, vec3 V, vec2 alpha)
{
    // Transform the view direction to the hemisphere configuration.
    V = normalize(vec3(V.xy * alpha, V.z));

    // Sample a spherical cap in (-V.z, 1].
    float phi = 2.0 * M_PI * Xi.x;
    float z = (1.0 - Xi.y) * (1.0 + V.z) - V.z;
    float sinTheta = sqrt(clamp(1.0 - z * z, 0.0, 1.0));
    float x = sinTheta * mx_cos(phi);
    float y = sinTheta * mx_sin(phi);
    vec3 c = vec3(x, y, z);

    // Compute the microfacet normal.
    vec3 H = c + V;

    // Transform the microfacet normal back to the ellipsoid configuration.
    H = normalize(vec3(H.xy * alpha, max(H.z, 0.0)));

    return H;
}

// https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf
// Equation 34
float mx_ggx_smith_G1(float cosTheta, float alpha)
{
    float cosTheta2 = mx_square(cosTheta);
    float tanTheta2 = (1.0 - cosTheta2) / cosTheta2;
    return 2.0 / (1.0 + sqrt(1.0 + mx_square(alpha) * tanTheta2));
}

// Height-correlated Smith masking-shadowing
// http://jcgt.org/published/0003/02/03/paper.pdf
// Equations 72 and 99
float mx_ggx_smith_G2(float NdotL, float NdotV, float alpha)
{
    float alpha2 = mx_square(alpha);
    float lambdaL = sqrt(alpha2 + (1.0 - alpha2) * mx_square(NdotL));
    float lambdaV = sqrt(alpha2 + (1.0 - alpha2) * mx_square(NdotV));
    return 2.0 / (lambdaL / NdotL + lambdaV / NdotV);
}

// Rational quadratic fit to Monte Carlo data for GGX directional albedo.
vec3 mx_ggx_dir_albedo_analytic(float NdotV, float alpha, vec3 F0, vec3 F90)
{
    float x = NdotV;
    float y = alpha;
    float x2 = mx_square(x);
    float y2 = mx_square(y);
    vec4 r = vec4(0.1003, 0.9345, 1.0, 1.0) +
             vec4(-0.6303, -2.323, -1.765, 0.2281) * x +
             vec4(9.748, 2.229, 8.263, 15.94) * y +
             vec4(-2.038, -3.748, 11.53, -55.83) * x * y +
             vec4(29.34, 1.424, 28.96, 13.08) * x2 +
             vec4(-8.245, -0.7684, -7.507, 41.26) * y2 +
             vec4(-26.44, 1.436, -36.11, 54.9) * x2 * y +
             vec4(19.99, 0.2913, 15.86, 300.2) * x * y2 +
             vec4(-5.448, 0.6286, 33.37, -285.1) * x2 * y2;
    vec2 AB = clamp(r.xy / r.zw, 0.0, 1.0);
    return F0 * AB.x + F90 * AB.y;
}

vec3 mx_ggx_dir_albedo_table_lookup(float NdotV, float alpha, vec3 F0, vec3 F90)
{
#if DIRECTIONAL_ALBEDO_METHOD == 1
    if (textureSize(u_albedoTable, 0).x > 1)
    {
        vec2 AB = texture(u_albedoTable, vec2(NdotV, alpha)).rg;
        return F0 * AB.x + F90 * AB.y;
    }
#endif
    return vec3(0.0);
}

// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
vec3 mx_ggx_dir_albedo_monte_carlo(float NdotV, float alpha, vec3 F0, vec3 F90)
{
    NdotV = clamp(NdotV, M_FLOAT_EPS, 1.0);
    vec3 V = vec3(sqrt(1.0 - mx_square(NdotV)), 0, NdotV);

    vec2 AB = vec2(0.0);
    const int SAMPLE_COUNT = 64;
    for (int i = 0; i < SAMPLE_COUNT; i++)
    {
        vec2 Xi = mx_spherical_fibonacci(i, SAMPLE_COUNT);

        // Compute the half vector and incoming light direction.
        vec3 H = mx_ggx_importance_sample_VNDF(Xi, V, vec2(alpha));
        vec3 L = -reflect(V, H);
        
        // Compute dot products for this sample.
        float NdotL = clamp(L.z, M_FLOAT_EPS, 1.0);
        float VdotH = clamp(dot(V, H), M_FLOAT_EPS, 1.0);

        // Compute the Fresnel term.
        float Fc = mx_fresnel_schlick(VdotH, 0.0, 1.0);

        // Compute the per-sample geometric term.
        // https://hal.inria.fr/hal-00996995v2/document, Algorithm 2
        float G2 = mx_ggx_smith_G2(NdotL, NdotV, alpha);
        
        // Add the contribution of this sample.
        AB += vec2(G2 * (1.0 - Fc), G2 * Fc);
    }

    // Apply the global component of the geometric term and normalize.
    AB /= mx_ggx_smith_G1(NdotV, alpha) * float(SAMPLE_COUNT);

    // Return the final directional albedo.
    return F0 * AB.x + F90 * AB.y;
}

vec3 mx_ggx_dir_albedo(float NdotV, float alpha, vec3 F0, vec3 F90)
{
#if DIRECTIONAL_ALBEDO_METHOD == 0
    return mx_ggx_dir_albedo_analytic(NdotV, alpha, F0, F90);
#elif DIRECTIONAL_ALBEDO_METHOD == 1
    return mx_ggx_dir_albedo_table_lookup(NdotV, alpha, F0, F90);
#else
    return mx_ggx_dir_albedo_monte_carlo(NdotV, alpha, F0, F90);
#endif
}

float mx_ggx_dir_albedo(float NdotV, float alpha, float F0, float F90)
{
    return mx_ggx_dir_albedo(NdotV, alpha, vec3(F0), vec3(F90)).x;
}

// https://blog.selfshadow.com/publications/turquin/ms_comp_final.pdf
// Equations 14 and 16
vec3 mx_ggx_energy_compensation(float NdotV, float alpha, vec3 Fss)
{
    float Ess = mx_ggx_dir_albedo(NdotV, alpha, 1.0, 1.0);
    return 1.0 + Fss * (1.0 - Ess) / Ess;
}

float mx_ggx_energy_compensation(float NdotV, float alpha, float Fss)
{
    return mx_ggx_energy_compensation(NdotV, alpha, vec3(Fss)).x;
}

// Compute the average of an anisotropic alpha pair.
float mx_average_alpha(vec2 alpha)
{
    return sqrt(alpha.x * alpha.y);
}

// Convert a real-valued index of refraction to normal-incidence reflectivity.
float mx_ior_to_f0(float ior)
{
    return mx_square((ior - 1.0) / (ior + 1.0));
}

// Convert normal-incidence reflectivity to real-valued index of refraction.
float mx_f0_to_ior(float F0)
{
    float sqrtF0 = sqrt(clamp(F0, 0.01, 0.99));
    return (1.0 + sqrtF0) / (1.0 - sqrtF0);
}
vec3 mx_f0_to_ior(vec3 F0)
{
    vec3 sqrtF0 = sqrt(clamp(F0, 0.01, 0.99));
    return (vec3(1.0) + sqrtF0) / (vec3(1.0) - sqrtF0);
}

// https://renderwonk.com/publications/wp-generalization-adobe/gen-adobe.pdf
vec3 mx_fresnel_hoffman_schlick(float cosTheta, FresnelData fd)
{
    const float COS_THETA_MAX = 1.0 / 7.0;
    const float COS_THETA_FACTOR = 1.0 / (COS_THETA_MAX * pow(1.0 - COS_THETA_MAX, 6.0));

    float x = clamp(cosTheta, 0.0, 1.0);
    vec3 a = mix(fd.F0, fd.F90, pow(1.0 - COS_THETA_MAX, fd.exponent)) * (vec3(1.0) - fd.F82) * COS_THETA_FACTOR;
    return mix(fd.F0, fd.F90, pow(1.0 - x, fd.exponent)) - a * x * mx_pow6(1.0 - x);
}

// https://seblagarde.wordpress.com/2013/04/29/memo-on-fresnel-equations/
float mx_fresnel_dielectric(float cosTheta, float ior)
{
    float c = cosTheta;
    float g2 = ior*ior + c*c - 1.0;
    if (g2 < 0.0)
    {
        // Total internal reflection
        return 1.0;
    }

    float g = sqrt(g2);
    return 0.5 * mx_square((g - c) / (g + c)) *
                (1.0 + mx_square(((g + c) * c - 1.0) / ((g - c) * c + 1.0)));
}

// https://seblagarde.wordpress.com/2013/04/29/memo-on-fresnel-equations/
vec2 mx_fresnel_dielectric_polarized(float cosTheta, float ior)
{
    float cosTheta2 = mx_square(clamp(cosTheta, 0.0, 1.0));
    float sinTheta2 = 1.0 - cosTheta2;

    float t0 = max(ior * ior - sinTheta2, 0.0);
    float t1 = t0 + cosTheta2;
    float t2 = 2.0 * sqrt(t0) * cosTheta;
    float Rs = (t1 - t2) / (t1 + t2);

    float t3 = cosTheta2 * t0 + sinTheta2 * sinTheta2;
    float t4 = t2 * sinTheta2;
    float Rp = Rs * (t3 - t4) / (t3 + t4);

    return vec2(Rp, Rs);
}

// https://seblagarde.wordpress.com/2013/04/29/memo-on-fresnel-equations/
void mx_fresnel_conductor_polarized(float cosTheta, vec3 n, vec3 k, out vec3 Rp, out vec3 Rs)
{
    float cosTheta2 = mx_square(clamp(cosTheta, 0.0, 1.0));
    float sinTheta2 = 1.0 - cosTheta2;
    vec3 n2 = n * n;
    vec3 k2 = k * k;

    vec3 t0 = n2 - k2 - vec3(sinTheta2);
    vec3 a2plusb2 = sqrt(t0 * t0 + 4.0 * n2 * k2);
    vec3 t1 = a2plusb2 + vec3(cosTheta2);
    vec3 a = sqrt(max(0.5 * (a2plusb2 + t0), 0.0));
    vec3 t2 = 2.0 * a * cosTheta;
    Rs = (t1 - t2) / (t1 + t2);

    vec3 t3 = cosTheta2 * a2plusb2 + vec3(sinTheta2 * sinTheta2);
    vec3 t4 = t2 * sinTheta2;
    Rp = Rs * (t3 - t4) / (t3 + t4);
}

vec3 mx_fresnel_conductor(float cosTheta, vec3 n, vec3 k)
{
    vec3 Rp, Rs;
    mx_fresnel_conductor_polarized(cosTheta, n, k, Rp, Rs);
    return 0.5 * (Rp  + Rs);
}

// https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html
void mx_fresnel_conductor_phase_polarized(float cosTheta, float eta1, vec3 eta2, vec3 kappa2, out vec3 phiP, out vec3 phiS)
{
    vec3 k2 = kappa2 / eta2;
    vec3 sinThetaSqr = vec3(1.0) - cosTheta * cosTheta;
    vec3 A = eta2*eta2*(vec3(1.0)-k2*k2) - eta1*eta1*sinThetaSqr;
    vec3 B = sqrt(A*A + mx_square(2.0*eta2*eta2*k2));
    vec3 U = sqrt((A+B)/2.0);
    vec3 V = max(vec3(0.0), sqrt((B-A)/2.0));

    phiS = mx_atan(2.0*eta1*V*cosTheta, U*U + V*V - mx_square(eta1*cosTheta));
    phiP = mx_atan(2.0*eta1*eta2*eta2*cosTheta * (2.0*k2*U - (vec3(1.0)-k2*k2) * V),
                   mx_square(eta2*eta2*(vec3(1.0)+k2*k2)*cosTheta) - eta1*eta1*(U*U+V*V));
}

// https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html
vec3 mx_eval_sensitivity(float opd, vec3 shift)
{
    // Use Gaussian fits, given by 3 parameters: val, pos and var
    float phase = 2.0*M_PI * opd;
    vec3 val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
    vec3 pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
    vec3 var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);
    vec3 xyz = val * sqrt(2.0*M_PI * var) * mx_cos(pos * phase + shift) * exp(- var * phase*phase);
    xyz.x   += 9.7470e-14 * sqrt(2.0*M_PI * 4.5282e+09) * mx_cos(2.2399e+06 * phase + shift[0]) * exp(- 4.5282e+09 * phase*phase);
    return xyz / 1.0685e-7;
}

// A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence
// https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html
vec3 mx_fresnel_airy(float cosTheta, FresnelData fd)
{
    // XYZ to CIE 1931 RGB color space (using neutral E illuminant)
    const mat3 XYZ_TO_RGB = mat3(2.3706743, -0.5138850, 0.0052982, -0.9000405, 1.4253036, -0.0146949, -0.4706338, 0.0885814, 1.0093968);

    // Assume vacuum on the outside
    float eta1 = 1.0;
    float eta2 = max(fd.tf_ior, eta1);
    vec3 eta3 = (fd.model == FRESNEL_MODEL_SCHLICK) ? mx_f0_to_ior(fd.F0) : fd.ior;
    vec3 kappa3 = (fd.model == FRESNEL_MODEL_SCHLICK) ? vec3(0.0) : fd.extinction;
    float cosThetaT = sqrt(1.0 - (1.0 - mx_square(cosTheta)) * mx_square(eta1 / eta2));

    // First interface
    vec2 R12 = mx_fresnel_dielectric_polarized(cosTheta, eta2 / eta1);
    if (cosThetaT <= 0.0)
    {
        // Total internal reflection
        R12 = vec2(1.0);
    }
    vec2 T121 = vec2(1.0) - R12;

    // Second interface
    vec3 R23p, R23s;
    if (fd.model == FRESNEL_MODEL_SCHLICK)
    {
        vec3 f = mx_fresnel_hoffman_schlick(cosThetaT, fd);
        R23p = 0.5 * f;
        R23s = 0.5 * f;
    }
    else
    {
        mx_fresnel_conductor_polarized(cosThetaT, eta3 / eta2, kappa3 / eta2, R23p, R23s);
    }

    // Phase shift
    float cosB = mx_cos(mx_atan(eta2 / eta1));
    vec2 phi21 = vec2(cosTheta < cosB ? 0.0 : M_PI, M_PI);
    vec3 phi23p, phi23s;
    if (fd.model == FRESNEL_MODEL_SCHLICK)
    {
        phi23p = vec3((eta3[0] < eta2) ? M_PI : 0.0,
                      (eta3[1] < eta2) ? M_PI : 0.0,
                      (eta3[2] < eta2) ? M_PI : 0.0);
        phi23s = phi23p;
    }
    else
    {
        mx_fresnel_conductor_phase_polarized(cosThetaT, eta2, eta3, kappa3, phi23p, phi23s);
    }
    vec3 r123p = max(sqrt(R12.x*R23p), 0.0);
    vec3 r123s = max(sqrt(R12.y*R23s), 0.0);

    // Iridescence term
    vec3 I = vec3(0.0);
    vec3 Cm, Sm;

    // Optical path difference
    float distMeters = fd.tf_thickness * 1.0e-9;
    float opd = 2.0 * eta2 * cosThetaT * distMeters;

    // Iridescence term using spectral antialiasing for Parallel polarization

    // Reflectance term for m=0 (DC term amplitude)
    vec3 Rs = (mx_square(T121.x) * R23p) / (vec3(1.0) - R12.x*R23p);
    I += R12.x + Rs;

    // Reflectance term for m>0 (pairs of diracs)
    Cm = Rs - T121.x;
    for (int m=1; m<=2; m++)
    {
        Cm *= r123p;
        Sm  = 2.0 * mx_eval_sensitivity(float(m) * opd, float(m)*(phi23p+vec3(phi21.x)));
        I  += Cm*Sm;
    }

    // Iridescence term using spectral antialiasing for Perpendicular polarization

    // Reflectance term for m=0 (DC term amplitude)
    vec3 Rp = (mx_square(T121.y) * R23s) / (vec3(1.0) - R12.y*R23s);
    I += R12.y + Rp;

    // Reflectance term for m>0 (pairs of diracs)
    Cm = Rp - T121.y;
    for (int m=1; m<=2; m++)
    {
        Cm *= r123s;
        Sm  = 2.0 * mx_eval_sensitivity(float(m) * opd, float(m)*(phi23s+vec3(phi21.y)));
        I  += Cm*Sm;
    }

    // Average parallel and perpendicular polarization
    I *= 0.5;

    // Convert back to RGB reflectance
    I = clamp(XYZ_TO_RGB * I, 0.0, 1.0);

    return I;
}

FresnelData mx_init_fresnel_dielectric(float ior, float tf_thickness, float tf_ior)
{
    FresnelData fd;
    fd.model = FRESNEL_MODEL_DIELECTRIC;
    fd.airy = tf_thickness > 0.0;
    fd.ior = vec3(ior);
    fd.extinction = vec3(0.0);
    fd.F0 = vec3(0.0);
    fd.F82 = vec3(0.0);
    fd.F90 = vec3(0.0);
    fd.exponent = 0.0;
    fd.tf_thickness = tf_thickness;
    fd.tf_ior = tf_ior;
    fd.refraction = false;
    return fd;
}

FresnelData mx_init_fresnel_conductor(vec3 ior, vec3 extinction, float tf_thickness, float tf_ior)
{
    FresnelData fd;
    fd.model = FRESNEL_MODEL_CONDUCTOR;
    fd.airy = tf_thickness > 0.0;
    fd.ior = ior;
    fd.extinction = extinction;
    fd.F0 = vec3(0.0);
    fd.F82 = vec3(0.0);
    fd.F90 = vec3(0.0);
    fd.exponent = 0.0;
    fd.tf_thickness = tf_thickness;
    fd.tf_ior = tf_ior;
    fd.refraction = false;
    return fd;
}

FresnelData mx_init_fresnel_schlick(vec3 F0, vec3 F82, vec3 F90, float exponent, float tf_thickness, float tf_ior)
{
    FresnelData fd;
    fd.model = FRESNEL_MODEL_SCHLICK;
    fd.airy = tf_thickness > 0.0;
    fd.ior = vec3(0.0);
    fd.extinction = vec3(0.0);
    fd.F0 = F0;
    fd.F82 = F82;
    fd.F90 = F90;
    fd.exponent = exponent;
    fd.tf_thickness = tf_thickness;
    fd.tf_ior = tf_ior;
    fd.refraction = false;
    return fd;
}

vec3 mx_compute_fresnel(float cosTheta, FresnelData fd)
{
    if (fd.airy)
    {
         return mx_fresnel_airy(cosTheta, fd);
    }
    else if (fd.model == FRESNEL_MODEL_DIELECTRIC)
    {
        return vec3(mx_fresnel_dielectric(cosTheta, fd.ior.x));
    }
    else if (fd.model == FRESNEL_MODEL_CONDUCTOR)
    {
        return mx_fresnel_conductor(cosTheta, fd.ior, fd.extinction);
    }
    else
    {
        return mx_fresnel_hoffman_schlick(cosTheta, fd);
    }
}

// Compute the refraction of a ray through a solid sphere.
vec3 mx_refraction_solid_sphere(vec3 R, vec3 N, float ior)
{
    R = refract(R, N, 1.0 / ior);
    vec3 N1 = normalize(R * dot(R, N) - N * 0.5);
    return refract(R, N1, ior);
}

vec2 mx_latlong_projection(vec3 dir)
{
    float latitude = -mx_asin(dir.y) * M_PI_INV + 0.5;
    float longitude = mx_atan(dir.x, -dir.z) * M_PI_INV * 0.5 + 0.5;
    return vec2(longitude, latitude);
}

vec3 mx_latlong_map_lookup(vec3 dir, mat4 transform, float lod, sampler2D envSampler)
{
    vec3 envDir = normalize((transform * vec4(dir,0.0)).xyz);
    vec2 uv = mx_latlong_projection(envDir);
    return textureLod(envSampler, uv, lod).rgb;
}

// Return the mip level with the appropriate coverage for a filtered importance sample.
// https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch20.html
// Section 20.4 Equation 13
float mx_latlong_compute_lod(vec3 dir, float pdf, float maxMipLevel, int envSamples)
{
    const float MIP_LEVEL_OFFSET = 1.5;
    float effectiveMaxMipLevel = maxMipLevel - MIP_LEVEL_OFFSET;
    float distortion = sqrt(1.0 - mx_square(dir.y));
    return max(effectiveMaxMipLevel - 0.5 * log2(float(envSamples) * pdf * distortion), 0.0);
}

vec3 mx_environment_radiance(vec3 N, vec3 V, vec3 X, vec2 alpha, int distribution, FresnelData fd)
{
    // Generate tangent frame.
    X = normalize(X - dot(X, N) * N);
    vec3 Y = cross(N, X);
    mat3 tangentToWorld = mat3(X, Y, N);

    // Transform the view vector to tangent space.
    V = vec3(dot(V, X), dot(V, Y), dot(V, N));

    // Compute derived properties.
    float NdotV = clamp(V.z, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(alpha);
    float G1V = mx_ggx_smith_G1(NdotV, avgAlpha);
    
    // Integrate outgoing radiance using filtered importance sampling.
    // http://cgg.mff.cuni.cz/~jaroslav/papers/2008-egsr-fis/2008-egsr-fis-final-embedded.pdf
    vec3 radiance = vec3(0.0);
    int envRadianceSamples = u_envRadianceSamples;
    for (int i = 0; i < envRadianceSamples; i++)
    {
        vec2 Xi = mx_spherical_fibonacci(i, envRadianceSamples);

        // Compute the half vector and incoming light direction.
        vec3 H = mx_ggx_importance_sample_VNDF(Xi, V, alpha);
        vec3 L = fd.refraction ? mx_refraction_solid_sphere(-V, H, fd.ior.x) : -reflect(V, H);
        
        // Compute dot products for this sample.
        float NdotL = clamp(L.z, M_FLOAT_EPS, 1.0);
        float VdotH = clamp(dot(V, H), M_FLOAT_EPS, 1.0);

        // Sample the environment light from the given direction.
        vec3 Lw = tangentToWorld * L;
        float pdf = mx_ggx_NDF(H, alpha) * G1V / (4.0 * NdotV);
        float lod = mx_latlong_compute_lod(Lw, pdf, float(u_envRadianceMips - 1), envRadianceSamples);
        vec3 sampleColor = mx_latlong_map_lookup(Lw, u_envMatrix, lod, u_envRadiance);

        // Compute the Fresnel term.
        vec3 F = mx_compute_fresnel(VdotH, fd);

        // Compute the geometric term.
        float G = mx_ggx_smith_G2(NdotL, NdotV, avgAlpha);

        // Compute the combined FG term, which simplifies to inverted Fresnel for refraction.
        vec3 FG = fd.refraction ? vec3(1.0) - F : F * G;

        // Add the radiance contribution of this sample.
        // From https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
        //   incidentLight = sampleColor * NdotL
        //   microfacetSpecular = D * F * G / (4 * NdotL * NdotV)
        //   pdf = D * G1V / (4 * NdotV);
        //   radiance = incidentLight * microfacetSpecular / pdf
        radiance += sampleColor * FG;
    }

    // Apply the global component of the geometric term and normalize.
    radiance /= G1V * float(envRadianceSamples);

    // Return the final radiance.
    return radiance * u_envLightIntensity;
}

vec3 mx_environment_irradiance(vec3 N)
{
    vec3 Li = mx_latlong_map_lookup(N, u_envMatrix, 0.0, u_envIrradiance);
    return Li * u_envLightIntensity;
}


vec3 mx_surface_transmission(vec3 N, vec3 V, vec3 X, vec2 alpha, int distribution, FresnelData fd, vec3 tint)
{
    // Approximate the appearance of surface transmission as glossy
    // environment map refraction, ignoring any scene geometry that might
    // be visible through the surface.
    fd.refraction = true;
    if (u_refractionTwoSided)
    {
        tint = mx_square(tint);
    }
    return mx_environment_radiance(N, V, X, alpha, distribution, fd) * tint;
}

struct LightData
{
    int type;
};

uniform LightData u_lightData[MAX_LIGHT_SOURCES];

int numActiveLightSources()
{
    return min(u_numActiveLightSources, MAX_LIGHT_SOURCES) ;
}

void sampleLightSource(LightData light, vec3 position, out lightshader result)
{
    result.intensity = vec3(0.0);
    result.direction = vec3(0.0);
}

void mx_roughness_anisotropy(float roughness, float anisotropy, out vec2 result)
{
    float roughness_sqr = clamp(roughness*roughness, M_FLOAT_EPS, 1.0);
    if (anisotropy > 0.0)
    {
        float aspect = sqrt(1.0 - clamp(anisotropy, 0.0, 0.98));
        result.x = min(roughness_sqr / aspect, 1.0);
        result.y = roughness_sqr * aspect;
    }
    else
    {
        result.x = roughness_sqr;
        result.y = roughness_sqr;
    }
}


const float FUJII_CONSTANT_1 = 0.5 - 2.0 / (3.0 * M_PI);
const float FUJII_CONSTANT_2 = 2.0 / 3.0 - 28.0 / (15.0 * M_PI);

// Qualitative Oren-Nayar diffuse with simplified math:
// https://www1.cs.columbia.edu/CAVE/publications/pdfs/Oren_SIGGRAPH94.pdf
float mx_oren_nayar_diffuse(float NdotV, float NdotL, float LdotV, float roughness)
{
    float s = LdotV - NdotL * NdotV;
    float stinv = (s > 0.0) ? s / max(NdotL, NdotV) : 0.0;

    float sigma2 = mx_square(roughness);
    float A = 1.0 - 0.5 * (sigma2 / (sigma2 + 0.33));
    float B = 0.45 * sigma2 / (sigma2 + 0.09);

    return A + B * stinv;
}

// Rational quadratic fit to Monte Carlo data for Oren-Nayar directional albedo.
float mx_oren_nayar_diffuse_dir_albedo_analytic(float NdotV, float roughness)
{
    vec2 r = vec2(1.0, 1.0) +
             vec2(-0.4297, -0.6076) * roughness +
             vec2(-0.7632, -0.4993) * NdotV * roughness +
             vec2(1.4385, 2.0315) * mx_square(roughness);
    return r.x / r.y;
}

float mx_oren_nayar_diffuse_dir_albedo_table_lookup(float NdotV, float roughness)
{
#if DIRECTIONAL_ALBEDO_METHOD == 1
    if (textureSize(u_albedoTable, 0).x > 1)
    {
        return texture(u_albedoTable, vec2(NdotV, roughness)).b;
    }
#endif
    return 0.0;
}

float mx_oren_nayar_diffuse_dir_albedo_monte_carlo(float NdotV, float roughness)
{
    NdotV = clamp(NdotV, M_FLOAT_EPS, 1.0);
    vec3 V = vec3(sqrt(1.0 - mx_square(NdotV)), 0, NdotV);

    float radiance = 0.0;
    const int SAMPLE_COUNT = 64;
    for (int i = 0; i < SAMPLE_COUNT; i++)
    {
        vec2 Xi = mx_spherical_fibonacci(i, SAMPLE_COUNT);

        // Compute the incoming light direction.
        vec3 L = mx_uniform_sample_hemisphere(Xi);
        
        // Compute dot products for this sample.
        float NdotL = clamp(L.z, M_FLOAT_EPS, 1.0);
        float LdotV = clamp(dot(L, V), M_FLOAT_EPS, 1.0);

        // Compute diffuse reflectance.
        float reflectance = mx_oren_nayar_diffuse(NdotV, NdotL, LdotV, roughness);

        // Add the radiance contribution of this sample.
        //   uniform_pdf = 1 / (2 * PI)
        //   radiance = (reflectance * NdotL) / (uniform_pdf * PI);
        radiance += reflectance * NdotL;
    }

    // Apply global components and normalize.
    radiance *= 2.0 / float(SAMPLE_COUNT);

    // Return the final directional albedo.
    return radiance;
}

float mx_oren_nayar_diffuse_dir_albedo(float NdotV, float roughness)
{
#if DIRECTIONAL_ALBEDO_METHOD == 2
    float dirAlbedo = mx_oren_nayar_diffuse_dir_albedo_monte_carlo(NdotV, roughness);
#else
    float dirAlbedo = mx_oren_nayar_diffuse_dir_albedo_analytic(NdotV, roughness);
#endif
    return clamp(dirAlbedo, 0.0, 1.0);
}

// Improved Oren-Nayar diffuse from Fujii:
// https://mimosa-pudica.net/improved-oren-nayar.html
float mx_oren_nayar_fujii_diffuse_dir_albedo(float cosTheta, float roughness)
{
    float A = 1.0 / (1.0 + FUJII_CONSTANT_1 * roughness);
    float B = roughness * A;
    float Si = sqrt(max(0.0, 1.0 - mx_square(cosTheta)));
    float G = Si * (mx_acos(clamp(cosTheta, -1.0, 1.0)) - Si * cosTheta) +
              2.0 * ((Si / cosTheta) * (1.0 - Si * Si * Si) - Si) / 3.0;
    return A + (B * G * M_PI_INV);
}

float mx_oren_nayar_fujii_diffuse_avg_albedo(float roughness)
{
    float A = 1.0 / (1.0 + FUJII_CONSTANT_1 * roughness);
    return A * (1.0 + FUJII_CONSTANT_2 * roughness);
}   

// Energy-compensated Oren-Nayar diffuse from OpenPBR Surface:
// https://academysoftwarefoundation.github.io/OpenPBR/
vec3 mx_oren_nayar_compensated_diffuse(float NdotV, float NdotL, float LdotV, float roughness, vec3 color)
{
    float s = LdotV - NdotL * NdotV;
    float stinv = (s > 0.0) ? s / max(NdotL, NdotV) : s;

    // Compute the single-scatter lobe.
    float A = 1.0 / (1.0 + FUJII_CONSTANT_1 * roughness);
    vec3 lobeSingleScatter = color * A * (1.0 + roughness * stinv);

    // Compute the multi-scatter lobe.
    float dirAlbedoV = mx_oren_nayar_fujii_diffuse_dir_albedo(NdotV, roughness);
    float dirAlbedoL = mx_oren_nayar_fujii_diffuse_dir_albedo(NdotL, roughness);
    float avgAlbedo = mx_oren_nayar_fujii_diffuse_avg_albedo(roughness);
    vec3 colorMultiScatter = mx_square(color) * avgAlbedo /
                             (vec3(1.0) - color * max(0.0, 1.0 - avgAlbedo));
    vec3 lobeMultiScatter = colorMultiScatter *
                            max(M_FLOAT_EPS, 1.0 - dirAlbedoV) *
                            max(M_FLOAT_EPS, 1.0 - dirAlbedoL) /
                            max(M_FLOAT_EPS, 1.0 - avgAlbedo);

    // Return the sum.
    return lobeSingleScatter + lobeMultiScatter;
}

vec3 mx_oren_nayar_compensated_diffuse_dir_albedo(float cosTheta, float roughness, vec3 color)
{
    float dirAlbedo = mx_oren_nayar_fujii_diffuse_dir_albedo(cosTheta, roughness);
    float avgAlbedo = mx_oren_nayar_fujii_diffuse_avg_albedo(roughness);
    vec3 colorMultiScatter = mx_square(color) * avgAlbedo /
                             (vec3(1.0) - color * max(0.0, 1.0 - avgAlbedo));
    return mix(colorMultiScatter, color, dirAlbedo);
}
  
// https://media.disneyanimation.com/uploads/production/publication_asset/48/asset/s2012_pbs_disney_brdf_notes_v3.pdf
// Section 5.3
float mx_burley_diffuse(float NdotV, float NdotL, float LdotH, float roughness)
{
    float F90 = 0.5 + (2.0 * roughness * mx_square(LdotH));
    float refL = mx_fresnel_schlick(NdotL, 1.0, F90);
    float refV = mx_fresnel_schlick(NdotV, 1.0, F90);
    return refL * refV;
}

// Compute the directional albedo component of Burley diffuse for the given
// view angle and roughness.  Curve fit provided by Stephen Hill.
float mx_burley_diffuse_dir_albedo(float NdotV, float roughness)
{
    float x = NdotV;
    float fit0 = 0.97619 - 0.488095 * mx_pow5(1.0 - x);
    float fit1 = 1.55754 + (-2.02221 + (2.56283 - 1.06244 * x) * x) * x;
    return mix(fit0, fit1, roughness);
}

// Evaluate the Burley diffusion profile for the given distance and diffusion shape.
// Based on https://graphics.pixar.com/library/ApproxBSSRDF/
vec3 mx_burley_diffusion_profile(float dist, vec3 shape)
{
    vec3 num1 = exp(-shape * dist);
    vec3 num2 = exp(-shape * dist / 3.0);
    float denom = max(dist, M_FLOAT_EPS);
    return (num1 + num2) / denom;
}

// Integrate the Burley diffusion profile over a sphere of the given radius.
// Inspired by Eric Penner's presentation in http://advances.realtimerendering.com/s2011/
vec3 mx_integrate_burley_diffusion(vec3 N, vec3 L, float radius, vec3 mfp)
{
    float theta = mx_acos(dot(N, L));

    // Estimate the Burley diffusion shape from mean free path.
    vec3 shape = vec3(1.0) / max(mfp, 0.1);

    // Integrate the profile over the sphere.
    vec3 sumD = vec3(0.0);
    vec3 sumR = vec3(0.0);
    const int SAMPLE_COUNT = 32;
    const float SAMPLE_WIDTH = (2.0 * M_PI) / float(SAMPLE_COUNT);
    for (int i = 0; i < SAMPLE_COUNT; i++)
    {
        float x = -M_PI + (float(i) + 0.5) * SAMPLE_WIDTH;
        float dist = radius * abs(2.0 * mx_sin(x * 0.5));
        vec3 R = mx_burley_diffusion_profile(dist, shape);
        sumD += R * max(mx_cos(theta + x), 0.0);
        sumR += R;
    }

    return sumD / sumR;
}

vec3 mx_subsurface_scattering_approx(vec3 N, vec3 L, vec3 P, vec3 albedo, vec3 mfp)
{
    float curvature = length(fwidth(N)) / length(fwidth(P));
    float radius = 1.0 / max(curvature, 0.01);
    return albedo * mx_integrate_burley_diffusion(N, L, radius, mfp) / vec3(M_PI);
}

void mx_oren_nayar_diffuse_bsdf_reflection(vec3 L, vec3 V, vec3 P, float occlusion, float weight, vec3 color, float roughness, vec3 normal, bool energy_compensation, inout BSDF bsdf)
{
    bsdf.throughput = vec3(0.0);

    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    normal = mx_forward_facing_normal(normal, V);

    float NdotV = clamp(dot(normal, V), M_FLOAT_EPS, 1.0);
    float NdotL = clamp(dot(normal, L), M_FLOAT_EPS, 1.0);
    float LdotV = clamp(dot(L, V), M_FLOAT_EPS, 1.0);

    vec3 diffuse = energy_compensation ?
                   mx_oren_nayar_compensated_diffuse(NdotV, NdotL, LdotV, roughness, color) :
                   mx_oren_nayar_diffuse(NdotV, NdotL, LdotV, roughness) * color;
    bsdf.response = diffuse * occlusion * weight * NdotL * M_PI_INV;
}

void mx_oren_nayar_diffuse_bsdf_indirect(vec3 V, float weight, vec3 color, float roughness, vec3 normal, bool energy_compensation, inout BSDF bsdf)
{
    bsdf.throughput = vec3(0.0);

    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    normal = mx_forward_facing_normal(normal, V);

    float NdotV = clamp(dot(normal, V), M_FLOAT_EPS, 1.0);

    vec3 diffuse = energy_compensation ?
                   mx_oren_nayar_compensated_diffuse_dir_albedo(NdotV, roughness, color) :
                   mx_oren_nayar_diffuse_dir_albedo(NdotV, roughness) * color;
    vec3 Li = mx_environment_irradiance(normal);
    bsdf.response = Li * diffuse * weight;
}


void mx_dielectric_bsdf_reflection(vec3 L, vec3 V, vec3 P, float occlusion, float weight, vec3 tint, float ior, vec2 roughness, float thinfilm_thickness, float thinfilm_ior, vec3 N, vec3 X, int distribution, int scatter_mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);

    X = normalize(X - dot(X, N) * N);
    vec3 Y = cross(N, X);
    vec3 H = normalize(L + V);

    float NdotL = clamp(dot(N, L), M_FLOAT_EPS, 1.0);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);
    float VdotH = clamp(dot(V, H), M_FLOAT_EPS, 1.0);

    vec2 safeAlpha = clamp(roughness, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(safeAlpha);
    vec3 Ht = vec3(dot(H, X), dot(H, Y), dot(H, N));

    vec3 safeTint = max(tint, 0.0);
    FresnelData fd = mx_init_fresnel_dielectric(ior, thinfilm_thickness, thinfilm_ior);
    vec3  F = mx_compute_fresnel(VdotH, fd);
    float D = mx_ggx_NDF(Ht, safeAlpha);
    float G = mx_ggx_smith_G2(NdotL, NdotV, avgAlpha);

    float F0 = mx_ior_to_f0(ior);
    vec3 comp = mx_ggx_energy_compensation(NdotV, avgAlpha, F);
    vec3 dirAlbedo = mx_ggx_dir_albedo(NdotV, avgAlpha, F0, 1.0) * comp;
    bsdf.throughput = 1.0 - dirAlbedo * weight;

    // Note: NdotL is cancelled out
    bsdf.response = D * F * G * comp * safeTint * occlusion * weight / (4.0 * NdotV);
}

void mx_dielectric_bsdf_transmission(vec3 V, float weight, vec3 tint, float ior, vec2 roughness, float thinfilm_thickness, float thinfilm_ior, vec3 N, vec3 X, int distribution, int scatter_mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);

    vec3 safeTint = max(tint, 0.0);
    FresnelData fd = mx_init_fresnel_dielectric(ior, thinfilm_thickness, thinfilm_ior);
    vec3 F = mx_compute_fresnel(NdotV, fd);

    vec2 safeAlpha = clamp(roughness, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(safeAlpha);

    float F0 = mx_ior_to_f0(ior);
    vec3 comp = mx_ggx_energy_compensation(NdotV, avgAlpha, F);
    vec3 dirAlbedo = mx_ggx_dir_albedo(NdotV, avgAlpha, F0, 1.0) * comp;
    bsdf.throughput = 1.0 - dirAlbedo * weight;

    if (scatter_mode != 0)
    {
        bsdf.response = mx_surface_transmission(N, V, X, safeAlpha, distribution, fd, safeTint) * weight;
    }
}

void mx_dielectric_bsdf_indirect(vec3 V, float weight, vec3 tint, float ior, vec2 roughness, float thinfilm_thickness, float thinfilm_ior, vec3 N, vec3 X, int distribution, int scatter_mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);

    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);

    vec3 safeTint = max(tint, 0.0);
    FresnelData fd = mx_init_fresnel_dielectric(ior, thinfilm_thickness, thinfilm_ior);
    vec3 F = mx_compute_fresnel(NdotV, fd);

    vec2 safeAlpha = clamp(roughness, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(safeAlpha);

    float F0 = mx_ior_to_f0(ior);
    vec3 comp = mx_ggx_energy_compensation(NdotV, avgAlpha, F);
    vec3 dirAlbedo = mx_ggx_dir_albedo(NdotV, avgAlpha, F0, 1.0) * comp;
    bsdf.throughput = 1.0 - dirAlbedo * weight;

    vec3 Li = mx_environment_radiance(N, V, X, safeAlpha, distribution, fd);
    bsdf.response = Li * safeTint * comp * weight;
}


void mx_generalized_schlick_bsdf_reflection(vec3 L, vec3 V, vec3 P, float occlusion, float weight, vec3 color0, vec3 color82, vec3 color90, float exponent, vec2 roughness, float thinfilm_thickness, float thinfilm_ior, vec3 N, vec3 X, int distribution, int scatter_mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);

    X = normalize(X - dot(X, N) * N);
    vec3 Y = cross(N, X);
    vec3 H = normalize(L + V);

    float NdotL = clamp(dot(N, L), M_FLOAT_EPS, 1.0);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);
    float VdotH = clamp(dot(V, H), M_FLOAT_EPS, 1.0);

    vec2 safeAlpha = clamp(roughness, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(safeAlpha);
    vec3 Ht = vec3(dot(H, X), dot(H, Y), dot(H, N));

    vec3 safeColor0 = max(color0, 0.0);
    vec3 safeColor82 = max(color82, 0.0);
    vec3 safeColor90 = max(color90, 0.0);
    FresnelData fd = mx_init_fresnel_schlick(safeColor0, safeColor82, safeColor90, exponent, thinfilm_thickness, thinfilm_ior);
    vec3  F = mx_compute_fresnel(VdotH, fd);
    float D = mx_ggx_NDF(Ht, safeAlpha);
    float G = mx_ggx_smith_G2(NdotL, NdotV, avgAlpha);

    vec3 comp = mx_ggx_energy_compensation(NdotV, avgAlpha, F);
    vec3 dirAlbedo = mx_ggx_dir_albedo(NdotV, avgAlpha, safeColor0, safeColor90) * comp;
    float avgDirAlbedo = dot(dirAlbedo, vec3(1.0 / 3.0));
    bsdf.throughput = vec3(1.0 - avgDirAlbedo * weight);

    // Note: NdotL is cancelled out
    bsdf.response = D * F * G * comp * occlusion * weight / (4.0 * NdotV);
}

void mx_generalized_schlick_bsdf_transmission(vec3 V, float weight, vec3 color0, vec3 color82, vec3 color90, float exponent, vec2 roughness, float thinfilm_thickness, float thinfilm_ior, vec3 N, vec3 X, int distribution, int scatter_mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);

    vec3 safeColor0 = max(color0, 0.0);
    vec3 safeColor82 = max(color82, 0.0);
    vec3 safeColor90 = max(color90, 0.0);
    FresnelData fd = mx_init_fresnel_schlick(safeColor0, safeColor82, safeColor90, exponent, thinfilm_thickness, thinfilm_ior);
    vec3 F = mx_compute_fresnel(NdotV, fd);

    vec2 safeAlpha = clamp(roughness, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(safeAlpha);

    vec3 comp = mx_ggx_energy_compensation(NdotV, avgAlpha, F);
    vec3 dirAlbedo = mx_ggx_dir_albedo(NdotV, avgAlpha, safeColor0, safeColor90) * comp;
    float avgDirAlbedo = dot(dirAlbedo, vec3(1.0 / 3.0));
    bsdf.throughput = vec3(1.0 - avgDirAlbedo * weight);

    if (scatter_mode != 0)
    {
        float avgF0 = dot(safeColor0, vec3(1.0 / 3.0));
        fd.ior = vec3(mx_f0_to_ior(avgF0));
        bsdf.response = mx_surface_transmission(N, V, X, safeAlpha, distribution, fd, vec3(1.0)) * weight;
    }
}

void mx_generalized_schlick_bsdf_indirect(vec3 V, float weight, vec3 color0, vec3 color82, vec3 color90, float exponent, vec2 roughness, float thinfilm_thickness, float thinfilm_ior, vec3 N, vec3 X, int distribution, int scatter_mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);

    vec3 safeColor0 = max(color0, 0.0);
    vec3 safeColor82 = max(color82, 0.0);
    vec3 safeColor90 = max(color90, 0.0);
    FresnelData fd = mx_init_fresnel_schlick(safeColor0, safeColor82, safeColor90, exponent, thinfilm_thickness, thinfilm_ior);
    vec3 F = mx_compute_fresnel(NdotV, fd);

    vec2 safeAlpha = clamp(roughness, M_FLOAT_EPS, 1.0);
    float avgAlpha = mx_average_alpha(safeAlpha);
    vec3 comp = mx_ggx_energy_compensation(NdotV, avgAlpha, F);
    vec3 dirAlbedo = mx_ggx_dir_albedo(NdotV, avgAlpha, safeColor0, safeColor90) * comp;
    float avgDirAlbedo = dot(dirAlbedo, vec3(1.0 / 3.0));
    bsdf.throughput = vec3(1.0 - avgDirAlbedo * weight);

    vec3 Li = mx_environment_radiance(N, V, X, safeAlpha, distribution, fd);
    bsdf.response = Li * comp * weight;
}

void mx_uniform_edf(vec3 N, vec3 L, vec3 color, out EDF result)
{
    result = color;
}


// https://fpsunflower.github.io/ckulla/data/s2017_pbs_imageworks_sheen.pdf
// Equation 2
float mx_imageworks_sheen_NDF(float NdotH, float roughness)
{
    float invRoughness = 1.0 / max(roughness, 0.005);
    float cos2 = NdotH * NdotH;
    float sin2 = 1.0 - cos2;
    return (2.0 + invRoughness) * pow(sin2, invRoughness * 0.5) / (2.0 * M_PI);
}

float mx_imageworks_sheen_brdf(float NdotL, float NdotV, float NdotH, float roughness)
{
    // Microfacet distribution.
    float D = mx_imageworks_sheen_NDF(NdotH, roughness);

    // Fresnel and geometry terms are ignored.
    float F = 1.0;
    float G = 1.0;

    // We use a smoother denominator, as in:
    // https://blog.selfshadow.com/publications/s2013-shading-course/rad/s2013_pbs_rad_notes.pdf
    return D * F * G / (4.0 * (NdotL + NdotV - NdotL*NdotV));
}

// Rational quadratic fit to Monte Carlo data for Imageworks sheen directional albedo.
float mx_imageworks_sheen_dir_albedo_analytic(float NdotV, float roughness)
{
    vec2 r = vec2(13.67300, 1.0) +
             vec2(-68.78018, 61.57746) * NdotV +
             vec2(799.08825, 442.78211) * roughness +
             vec2(-905.00061, 2597.49308) * NdotV * roughness +
             vec2(60.28956, 121.81241) * mx_square(NdotV) +
             vec2(1086.96473, 3045.55075) * mx_square(roughness);
    return r.x / r.y;
}

float mx_imageworks_sheen_dir_albedo_table_lookup(float NdotV, float roughness)
{
#if DIRECTIONAL_ALBEDO_METHOD == 1
    if (textureSize(u_albedoTable, 0).x > 1)
    {
        return texture(u_albedoTable, vec2(NdotV, roughness)).b;
    }
#endif
    return 0.0;
}

float mx_imageworks_sheen_dir_albedo_monte_carlo(float NdotV, float roughness)
{
    NdotV = clamp(NdotV, M_FLOAT_EPS, 1.0);
    vec3 V = vec3(sqrt(1.0f - mx_square(NdotV)), 0, NdotV);

    float radiance = 0.0;
    const int SAMPLE_COUNT = 64;
    for (int i = 0; i < SAMPLE_COUNT; i++)
    {
        vec2 Xi = mx_spherical_fibonacci(i, SAMPLE_COUNT);

        // Compute the incoming light direction and half vector.
        vec3 L = mx_uniform_sample_hemisphere(Xi);
        vec3 H = normalize(L + V);
        
        // Compute dot products for this sample.
        float NdotL = clamp(L.z, M_FLOAT_EPS, 1.0);
        float NdotH = clamp(H.z, M_FLOAT_EPS, 1.0);

        // Compute sheen reflectance.
        float reflectance = mx_imageworks_sheen_brdf(NdotL, NdotV, NdotH, roughness);

        // Add the radiance contribution of this sample.
        //   uniform_pdf = 1 / (2 * PI)
        //   radiance = reflectance * NdotL / uniform_pdf;
        radiance += reflectance * NdotL * 2.0 * M_PI;
    }

    // Return the final directional albedo.
    return radiance / float(SAMPLE_COUNT);
}

float mx_imageworks_sheen_dir_albedo(float NdotV, float roughness)
{
#if DIRECTIONAL_ALBEDO_METHOD == 0
    float dirAlbedo = mx_imageworks_sheen_dir_albedo_analytic(NdotV, roughness);
#elif DIRECTIONAL_ALBEDO_METHOD == 1
    float dirAlbedo = mx_imageworks_sheen_dir_albedo_table_lookup(NdotV, roughness);
#else
    float dirAlbedo = mx_imageworks_sheen_dir_albedo_monte_carlo(NdotV, roughness);
#endif
    return clamp(dirAlbedo, 0.0, 1.0);
}

// The following functions are adapted from https://github.com/tizian/ltc-sheen.
// \"Practical Multiple-Scattering Sheen Using Linearly Transformed Cosines\", Zeltner et al.

// Gaussian fit to directional albedo table.
float mx_zeltner_sheen_dir_albedo(float x, float y)
{
    float s = y*(0.0206607 + 1.58491*y)/(0.0379424 + y*(1.32227 + y));
    float m = y*(-0.193854 + y*(-1.14885 + y*(1.7932 - 0.95943*y*y)))/(0.046391 + y);
    float o = y*(0.000654023 + (-0.0207818 + 0.119681*y)*y)/(1.26264 + y*(-1.92021 + y));
    return exp(-0.5*mx_square((x - m)/s))/(s*sqrt(2.0*M_PI)) + o;
}

// Rational fits to LTC matrix coefficients.
float mx_zeltner_sheen_ltc_aInv(float x, float y)
{
    return (2.58126*x + 0.813703*y)*y/(1.0 + 0.310327*x*x + 2.60994*x*y);
}

float mx_zeltner_sheen_ltc_bInv(float x, float y)
{
    return sqrt(1.0 - x)*(y - 1.0)*y*y*y/(0.0000254053 + 1.71228*x - 1.71506*x*y + 1.34174*y*y);
}

// V and N are assumed to be unit vectors.
mat3 mx_orthonormal_basis_ltc(vec3 V, vec3 N, float NdotV)
{
    // Generate a tangent vector in the plane of V and N.
    // This required to correctly orient the LTC lobe.
    vec3 X = V - N*NdotV;
    float lenSqr = dot(X, X);
    if (lenSqr > 0.0)
    {
        X *= mx_inversesqrt(lenSqr);
        vec3 Y = cross(N, X);
        return mat3(X, Y, N);
    }

    // If lenSqr == 0, then V == N, so any orthonormal basis will do.
    return mx_orthonormal_basis(N);
}

// Multiplication by directional albedo is handled by the calling function.
float mx_zeltner_sheen_brdf(vec3 L, vec3 V, vec3 N, float NdotV, float roughness)
{
    mat3 toLTC = transpose(mx_orthonormal_basis_ltc(V, N, NdotV));
    vec3 w = toLTC * L;

    float aInv = mx_zeltner_sheen_ltc_aInv(NdotV, roughness);
    float bInv = mx_zeltner_sheen_ltc_bInv(NdotV, roughness);

    // Transform w to original configuration (clamped cosine).
    //                 |aInv    0 bInv|
    // wo = M^-1 . w = |   0 aInv    0| . w
    //                 |   0    0    1|
    vec3 wo = vec3(aInv*w.x + bInv*w.z, aInv * w.y, w.z);
    float lenSqr = dot(wo, wo);

    // D(w) = Do(M^-1.w / ||M^-1.w||) . |M^-1| / ||M^-1.w||^3
    //      = Do(M^-1.w) . |M^-1| / ||M^-1.w||^4
    //      = Do(wo) . |M^-1| / dot(wo, wo)^2
    //      = Do(wo) . aInv^2 / dot(wo, wo)^2
    //      = Do(wo) . (aInv / dot(wo, wo))^2
    return max(wo.z, 0.0) * M_PI_INV * mx_square(aInv / lenSqr);
}

vec3 mx_zeltner_sheen_importance_sample(vec2 Xi, vec3 V, vec3 N, float roughness, out float pdf)
{
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    roughness = clamp(roughness, 0.01, 1.0); // Clamp to range of original impl.

    vec3 wo = mx_cosine_sample_hemisphere(Xi);

    float aInv = mx_zeltner_sheen_ltc_aInv(NdotV, roughness);
    float bInv = mx_zeltner_sheen_ltc_bInv(NdotV, roughness);

    // Transform wo from original configuration (clamped cosine).
    //              |1/aInv      0 -bInv/aInv|
    // w = M . wo = |     0 1/aInv          0| . wo
    //              |     0      0          1|    
    vec3 w = vec3(wo.x/aInv - wo.z*bInv/aInv, wo.y / aInv, wo.z);

    float lenSqr = dot(w, w);
    w *= mx_inversesqrt(lenSqr);

    // D(w) = Do(wo) . ||M.wo||^3 / |M|
    //      = Do(wo / ||M.wo||) . ||M.wo||^4 / |M| 
    //      = Do(w) . ||M.wo||^4 / |M| (possible because M doesn't change z component)
    //      = Do(w) . dot(w, w)^2 * aInv^2
    //      = Do(w) . (aInv * dot(w, w))^2
    pdf = max(w.z, 0.0) * M_PI_INV * mx_square(aInv * lenSqr);

    mat3 fromLTC = mx_orthonormal_basis_ltc(V, N, NdotV);
    w = fromLTC * w;

    return w;
}

void mx_sheen_bsdf_reflection(vec3 L, vec3 V, vec3 P, float occlusion, float weight, vec3 color, float roughness, vec3 N, int mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);

    if (mode == 0)
    {
        vec3 H = normalize(L + V);

        float NdotL = clamp(dot(N, L), M_FLOAT_EPS, 1.0);
        float NdotH = clamp(dot(N, H), M_FLOAT_EPS, 1.0);

        vec3 fr = color * mx_imageworks_sheen_brdf(NdotL, NdotV, NdotH, roughness);
        float dirAlbedo = mx_imageworks_sheen_dir_albedo(NdotV, roughness);
        bsdf.throughput = vec3(1.0 - dirAlbedo * weight);

        // We need to include NdotL from the light integral here
        // as in this case it's not cancelled out by the BRDF denominator.
        bsdf.response = fr * NdotL * occlusion * weight;
    }
    else
    {
        roughness = clamp(roughness, 0.01, 1.0); // Clamp to range of original impl.

        vec3 fr = color * mx_zeltner_sheen_brdf(L, V, N, NdotV, roughness);
        float dirAlbedo = mx_zeltner_sheen_dir_albedo(NdotV, roughness);
        bsdf.throughput = vec3(1.0 - dirAlbedo * weight);
        bsdf.response = dirAlbedo * fr * occlusion * weight;
    }
}

void mx_sheen_bsdf_indirect(vec3 V, float weight, vec3 color, float roughness, vec3 N, int mode, inout BSDF bsdf)
{
    if (weight < M_FLOAT_EPS)
    {
        return;
    }

    N = mx_forward_facing_normal(N, V);
    float NdotV = clamp(dot(N, V), M_FLOAT_EPS, 1.0);

    float dirAlbedo;
    if (mode == 0)
    {
        dirAlbedo = mx_imageworks_sheen_dir_albedo(NdotV, roughness);
    }
    else
    {
        roughness = clamp(roughness, 0.01, 1.0); // Clamp to range of original impl.
        dirAlbedo = mx_zeltner_sheen_dir_albedo(NdotV, roughness);
    }

    vec3 Li = mx_environment_irradiance(N);
    bsdf.throughput = vec3(1.0 - dirAlbedo * weight);
    bsdf.response = Li * color * dirAlbedo * weight;
}

void IMPL_gltf_pbr_surfaceshader(vec3 base_color, float metallic, float roughness, vec3 normal, vec3 tangent, float occlusion, float transmission, float specular, vec3 specular_color, float ior, float alpha, int alpha_mode, float alpha_cutoff, float iridescence, float iridescence_ior, float iridescence_thickness, vec3 sheen_color, float sheen_roughness, float clearcoat, float clearcoat_roughness, vec3 clearcoat_normal, vec3 emissive, float emissive_strength, float thickness, float attenuation_distance, vec3 attenuation_color, out surfaceshader out1)
{
    vec2 clearcoat_roughness_uv_out = vec2(0.0);
    mx_roughness_anisotropy(clearcoat_roughness, 0.000000, clearcoat_roughness_uv_out);
    const int sheen_color_r_index_tmp = 0;
    float sheen_color_r_out = sheen_color[sheen_color_r_index_tmp];
    const int sheen_color_g_index_tmp = 1;
    float sheen_color_g_out = sheen_color[sheen_color_g_index_tmp];
    const int sheen_color_b_index_tmp = 2;
    float sheen_color_b_out = sheen_color[sheen_color_b_index_tmp];
    float sheen_roughness_sq_out = sheen_roughness * sheen_roughness;
    const float one_minus_ior_in1_tmp = 1.000000;
    float one_minus_ior_out = one_minus_ior_in1_tmp - ior;
    const float one_plus_ior_in1_tmp = 1.000000;
    float one_plus_ior_out = one_plus_ior_in1_tmp + ior;
    const vec3 dielectric_f90_in1_tmp = vec3(1.000000, 1.000000, 1.000000);
    vec3 dielectric_f90_out = dielectric_f90_in1_tmp * specular;
    vec2 roughness_uv_out = vec2(0.0);
    mx_roughness_anisotropy(roughness, 0.000000, roughness_uv_out);
    vec3 emission_color_out = emissive * emissive_strength;
    const float opacity_mask_cutoff_in1_tmp = 1.000000;
    const float opacity_mask_cutoff_in2_tmp = 0.000000;
    float opacity_mask_cutoff_out = (alpha >= alpha_cutoff) ? opacity_mask_cutoff_in1_tmp : opacity_mask_cutoff_in2_tmp;
    float sheen_color_max_rg_out = max(sheen_color_r_out, sheen_color_g_out);
    float ior_div_out = one_minus_ior_out / one_plus_ior_out;
    const int opacity_mask_value2_tmp = 1;
    float opacity_mask_out = (alpha_mode == opacity_mask_value2_tmp) ? opacity_mask_cutoff_out : alpha;
    float sheen_intensity_out = max(sheen_color_max_rg_out, sheen_color_b_out);
    float dielectric_f0_from_ior_out = ior_div_out * ior_div_out;
    const int opacity_value2_tmp = 0;
    const float opacity_in1_tmp = 1.000000;
    float opacity_out = (alpha_mode == opacity_value2_tmp) ? opacity_in1_tmp : opacity_mask_out;
    vec3 sheen_color_normalized_out = sheen_color / sheen_intensity_out;
    vec3 dielectric_f0_from_ior_specular_color_out = specular_color * dielectric_f0_from_ior_out;
    const float clamped_dielectric_f0_from_ior_specular_color_in2_tmp = 1.000000;
    vec3 clamped_dielectric_f0_from_ior_specular_color_out = min(dielectric_f0_from_ior_specular_color_out, clamped_dielectric_f0_from_ior_specular_color_in2_tmp);
    vec3 dielectric_f0_out = clamped_dielectric_f0_from_ior_specular_color_out * specular;
    surfaceshader shader_constructor_out = surfaceshader(vec3(0.0),vec3(0.0));
    {
        vec3 N = normalize(normalWorld);
        vec3 V = normalize(u_viewPosition - positionWorld);
        vec3 P = positionWorld;

        float surfaceOpacity = opacity_out;

        // Shadow occlusion
        float occlusion = 1.0;

        // Light loop
        int numLights = numActiveLightSources();
        lightshader lightShader;
        for (int activeLightIndex = 0; activeLightIndex < numLights; ++activeLightIndex)
        {
            sampleLightSource(u_lightData[activeLightIndex], positionWorld, lightShader);
            vec3 L = lightShader.direction;

            // Calculate the BSDF response for this light source
            BSDF clearcoat_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_dielectric_bsdf_reflection(L, V, P, occlusion, clearcoat, vec3(1.000000, 1.000000, 1.000000), 1.500000, clearcoat_roughness_uv_out, 0.000000, 1.500000, clearcoat_normal, tangent, 0, 0, clearcoat_bsdf_out);
            BSDF sheen_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_sheen_bsdf_reflection(L, V, P, occlusion, sheen_intensity_out, sheen_color_normalized_out, sheen_roughness_sq_out, normal, 0, sheen_bsdf_out);
            BSDF tf_metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_reflection(L, V, P, occlusion, 1.000000, base_color, vec3(1.000000, 1.000000, 1.000000), vec3(1.000000, 1.000000, 1.000000), 5.000000, roughness_uv_out, iridescence_thickness, iridescence_ior, normal, tangent, 0, 0, tf_metal_bsdf_out);
            BSDF metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_reflection(L, V, P, occlusion, 1.000000, base_color, vec3(1.000000, 1.000000, 1.000000), vec3(1.000000, 1.000000, 1.000000), 5.000000, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 0, metal_bsdf_out);
            BSDF mix_iridescent_metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mix_iridescent_metal_bsdf_out.response = mix(metal_bsdf_out.response, tf_metal_bsdf_out.response, iridescence);
            mix_iridescent_metal_bsdf_out.throughput = mix(metal_bsdf_out.throughput, tf_metal_bsdf_out.throughput, iridescence);
            BSDF tf_reflection_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_reflection(L, V, P, occlusion, 1.000000, dielectric_f0_out, vec3(1.000000, 1.000000, 1.000000), dielectric_f90_out, 5.000000, roughness_uv_out, iridescence_thickness, iridescence_ior, normal, tangent, 0, 0, tf_reflection_bsdf_out);
            BSDF transmission_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            BSDF diffuse_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_oren_nayar_diffuse_bsdf_reflection(L, V, P, occlusion, 1.000000, base_color, 0.000000, normal, false, diffuse_bsdf_out);
            BSDF transmission_mix_out = BSDF(vec3(0.0),vec3(1.0));
            transmission_mix_out.response = mix(diffuse_bsdf_out.response, transmission_bsdf_out.response, transmission);
            transmission_mix_out.throughput = mix(diffuse_bsdf_out.throughput, transmission_bsdf_out.throughput, transmission);
            BSDF tf_dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            tf_dielectric_bsdf_out.response = tf_reflection_bsdf_out.response + transmission_mix_out.response * tf_reflection_bsdf_out.throughput;
            tf_dielectric_bsdf_out.throughput = tf_reflection_bsdf_out.throughput * transmission_mix_out.throughput;
            BSDF reflection_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_reflection(L, V, P, occlusion, 1.000000, dielectric_f0_out, vec3(1.000000, 1.000000, 1.000000), dielectric_f90_out, 5.000000, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 0, reflection_bsdf_out);
            // Omitted node 'transmission_mix'. Function already called in this scope.
            BSDF dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            dielectric_bsdf_out.response = reflection_bsdf_out.response + transmission_mix_out.response * reflection_bsdf_out.throughput;
            dielectric_bsdf_out.throughput = reflection_bsdf_out.throughput * transmission_mix_out.throughput;
            BSDF mix_iridescent_dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mix_iridescent_dielectric_bsdf_out.response = mix(dielectric_bsdf_out.response, tf_dielectric_bsdf_out.response, iridescence);
            mix_iridescent_dielectric_bsdf_out.throughput = mix(dielectric_bsdf_out.throughput, tf_dielectric_bsdf_out.throughput, iridescence);
            BSDF base_mix_out = BSDF(vec3(0.0),vec3(1.0));
            base_mix_out.response = mix(mix_iridescent_dielectric_bsdf_out.response, mix_iridescent_metal_bsdf_out.response, metallic);
            base_mix_out.throughput = mix(mix_iridescent_dielectric_bsdf_out.throughput, mix_iridescent_metal_bsdf_out.throughput, metallic);
            BSDF sheen_layer_out = BSDF(vec3(0.0),vec3(1.0));
            sheen_layer_out.response = sheen_bsdf_out.response + base_mix_out.response * sheen_bsdf_out.throughput;
            sheen_layer_out.throughput = sheen_bsdf_out.throughput * base_mix_out.throughput;
            BSDF clearcoat_layer_out = BSDF(vec3(0.0),vec3(1.0));
            clearcoat_layer_out.response = clearcoat_bsdf_out.response + sheen_layer_out.response * clearcoat_bsdf_out.throughput;
            clearcoat_layer_out.throughput = clearcoat_bsdf_out.throughput * sheen_layer_out.throughput;

            // Accumulate the light's contribution
            shader_constructor_out.color += lightShader.intensity * clearcoat_layer_out.response;
        }

        // Ambient occlusion
        occlusion = 1.0;

        // Add environment contribution
        {
            BSDF clearcoat_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_dielectric_bsdf_indirect(V, clearcoat, vec3(1.000000, 1.000000, 1.000000), 1.500000, clearcoat_roughness_uv_out, 0.000000, 1.500000, clearcoat_normal, tangent, 0, 0, clearcoat_bsdf_out);
            BSDF sheen_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_sheen_bsdf_indirect(V, sheen_intensity_out, sheen_color_normalized_out, sheen_roughness_sq_out, normal, 0, sheen_bsdf_out);
            BSDF tf_metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_indirect(V, 1.000000, base_color, vec3(1.000000, 1.000000, 1.000000), vec3(1.000000, 1.000000, 1.000000), 5.000000, roughness_uv_out, iridescence_thickness, iridescence_ior, normal, tangent, 0, 0, tf_metal_bsdf_out);
            BSDF metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_indirect(V, 1.000000, base_color, vec3(1.000000, 1.000000, 1.000000), vec3(1.000000, 1.000000, 1.000000), 5.000000, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 0, metal_bsdf_out);
            BSDF mix_iridescent_metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mix_iridescent_metal_bsdf_out.response = mix(metal_bsdf_out.response, tf_metal_bsdf_out.response, iridescence);
            mix_iridescent_metal_bsdf_out.throughput = mix(metal_bsdf_out.throughput, tf_metal_bsdf_out.throughput, iridescence);
            BSDF tf_reflection_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_indirect(V, 1.000000, dielectric_f0_out, vec3(1.000000, 1.000000, 1.000000), dielectric_f90_out, 5.000000, roughness_uv_out, iridescence_thickness, iridescence_ior, normal, tangent, 0, 0, tf_reflection_bsdf_out);
            BSDF transmission_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            BSDF diffuse_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_oren_nayar_diffuse_bsdf_indirect(V, 1.000000, base_color, 0.000000, normal, false, diffuse_bsdf_out);
            BSDF transmission_mix_out = BSDF(vec3(0.0),vec3(1.0));
            transmission_mix_out.response = mix(diffuse_bsdf_out.response, transmission_bsdf_out.response, transmission);
            transmission_mix_out.throughput = mix(diffuse_bsdf_out.throughput, transmission_bsdf_out.throughput, transmission);
            BSDF tf_dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            tf_dielectric_bsdf_out.response = tf_reflection_bsdf_out.response + transmission_mix_out.response * tf_reflection_bsdf_out.throughput;
            tf_dielectric_bsdf_out.throughput = tf_reflection_bsdf_out.throughput * transmission_mix_out.throughput;
            BSDF reflection_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_indirect(V, 1.000000, dielectric_f0_out, vec3(1.000000, 1.000000, 1.000000), dielectric_f90_out, 5.000000, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 0, reflection_bsdf_out);
            // Omitted node 'transmission_mix'. Function already called in this scope.
            BSDF dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            dielectric_bsdf_out.response = reflection_bsdf_out.response + transmission_mix_out.response * reflection_bsdf_out.throughput;
            dielectric_bsdf_out.throughput = reflection_bsdf_out.throughput * transmission_mix_out.throughput;
            BSDF mix_iridescent_dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mix_iridescent_dielectric_bsdf_out.response = mix(dielectric_bsdf_out.response, tf_dielectric_bsdf_out.response, iridescence);
            mix_iridescent_dielectric_bsdf_out.throughput = mix(dielectric_bsdf_out.throughput, tf_dielectric_bsdf_out.throughput, iridescence);
            BSDF base_mix_out = BSDF(vec3(0.0),vec3(1.0));
            base_mix_out.response = mix(mix_iridescent_dielectric_bsdf_out.response, mix_iridescent_metal_bsdf_out.response, metallic);
            base_mix_out.throughput = mix(mix_iridescent_dielectric_bsdf_out.throughput, mix_iridescent_metal_bsdf_out.throughput, metallic);
            BSDF sheen_layer_out = BSDF(vec3(0.0),vec3(1.0));
            sheen_layer_out.response = sheen_bsdf_out.response + base_mix_out.response * sheen_bsdf_out.throughput;
            sheen_layer_out.throughput = sheen_bsdf_out.throughput * base_mix_out.throughput;
            BSDF clearcoat_layer_out = BSDF(vec3(0.0),vec3(1.0));
            clearcoat_layer_out.response = clearcoat_bsdf_out.response + sheen_layer_out.response * clearcoat_bsdf_out.throughput;
            clearcoat_layer_out.throughput = clearcoat_bsdf_out.throughput * sheen_layer_out.throughput;

            shader_constructor_out.color += occlusion * clearcoat_layer_out.response;
        }

        // Add surface emission
        {
            EDF emission_out = EDF(0.0);
            mx_uniform_edf(N, V, emission_color_out, emission_out);
            shader_constructor_out.color += emission_out;
        }

        // Calculate the BSDF transmission for viewing direction
        {
            BSDF clearcoat_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_dielectric_bsdf_transmission(V, clearcoat, vec3(1.000000, 1.000000, 1.000000), 1.500000, clearcoat_roughness_uv_out, 0.000000, 1.500000, clearcoat_normal, tangent, 0, 0, clearcoat_bsdf_out);
            BSDF sheen_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            BSDF tf_metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_transmission(V, 1.000000, base_color, vec3(1.000000, 1.000000, 1.000000), vec3(1.000000, 1.000000, 1.000000), 5.000000, roughness_uv_out, iridescence_thickness, iridescence_ior, normal, tangent, 0, 0, tf_metal_bsdf_out);
            BSDF metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_transmission(V, 1.000000, base_color, vec3(1.000000, 1.000000, 1.000000), vec3(1.000000, 1.000000, 1.000000), 5.000000, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 0, metal_bsdf_out);
            BSDF mix_iridescent_metal_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mix_iridescent_metal_bsdf_out.response = mix(metal_bsdf_out.response, tf_metal_bsdf_out.response, iridescence);
            mix_iridescent_metal_bsdf_out.throughput = mix(metal_bsdf_out.throughput, tf_metal_bsdf_out.throughput, iridescence);
            BSDF tf_reflection_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_transmission(V, 1.000000, dielectric_f0_out, vec3(1.000000, 1.000000, 1.000000), dielectric_f90_out, 5.000000, roughness_uv_out, iridescence_thickness, iridescence_ior, normal, tangent, 0, 0, tf_reflection_bsdf_out);
            BSDF transmission_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_dielectric_bsdf_transmission(V, 1.000000, base_color, ior, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 1, transmission_bsdf_out);
            BSDF diffuse_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            BSDF transmission_mix_out = BSDF(vec3(0.0),vec3(1.0));
            transmission_mix_out.response = mix(diffuse_bsdf_out.response, transmission_bsdf_out.response, transmission);
            transmission_mix_out.throughput = mix(diffuse_bsdf_out.throughput, transmission_bsdf_out.throughput, transmission);
            BSDF tf_dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            tf_dielectric_bsdf_out.response = tf_reflection_bsdf_out.response + transmission_mix_out.response * tf_reflection_bsdf_out.throughput;
            tf_dielectric_bsdf_out.throughput = tf_reflection_bsdf_out.throughput * transmission_mix_out.throughput;
            BSDF reflection_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mx_generalized_schlick_bsdf_transmission(V, 1.000000, dielectric_f0_out, vec3(1.000000, 1.000000, 1.000000), dielectric_f90_out, 5.000000, roughness_uv_out, 0.000000, 1.500000, normal, tangent, 0, 0, reflection_bsdf_out);
            // Omitted node 'transmission_mix'. Function already called in this scope.
            BSDF dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            dielectric_bsdf_out.response = reflection_bsdf_out.response + transmission_mix_out.response * reflection_bsdf_out.throughput;
            dielectric_bsdf_out.throughput = reflection_bsdf_out.throughput * transmission_mix_out.throughput;
            BSDF mix_iridescent_dielectric_bsdf_out = BSDF(vec3(0.0),vec3(1.0));
            mix_iridescent_dielectric_bsdf_out.response = mix(dielectric_bsdf_out.response, tf_dielectric_bsdf_out.response, iridescence);
            mix_iridescent_dielectric_bsdf_out.throughput = mix(dielectric_bsdf_out.throughput, tf_dielectric_bsdf_out.throughput, iridescence);
            BSDF base_mix_out = BSDF(vec3(0.0),vec3(1.0));
            base_mix_out.response = mix(mix_iridescent_dielectric_bsdf_out.response, mix_iridescent_metal_bsdf_out.response, metallic);
            base_mix_out.throughput = mix(mix_iridescent_dielectric_bsdf_out.throughput, mix_iridescent_metal_bsdf_out.throughput, metallic);
            BSDF sheen_layer_out = BSDF(vec3(0.0),vec3(1.0));
            sheen_layer_out.response = sheen_bsdf_out.response + base_mix_out.response * sheen_bsdf_out.throughput;
            sheen_layer_out.throughput = sheen_bsdf_out.throughput * base_mix_out.throughput;
            BSDF clearcoat_layer_out = BSDF(vec3(0.0),vec3(1.0));
            clearcoat_layer_out.response = clearcoat_bsdf_out.response + sheen_layer_out.response * clearcoat_bsdf_out.throughput;
            clearcoat_layer_out.throughput = clearcoat_bsdf_out.throughput * sheen_layer_out.throughput;
            shader_constructor_out.color += clearcoat_layer_out.response;
        }

        // Compute and apply surface opacity
        {
            shader_constructor_out.color *= surfaceOpacity;
            shader_constructor_out.transparency = mix(vec3(1.0), shader_constructor_out.transparency, surfaceOpacity);
        }
    }

    out1 = shader_constructor_out;
}

void main()
{
    vec3 geomprop_Nworld_out1 = normalize(normalWorld);
    vec3 geomprop_Tworld_out1 = normalize(tangentWorld);
    surfaceshader SR_gold_out = surfaceshader(vec3(0.0),vec3(0.0));
    IMPL_gltf_pbr_surfaceshader(SR_gold_base_color, SR_gold_metallic, SR_gold_roughness, geomprop_Nworld_out1, geomprop_Tworld_out1, SR_gold_occlusion, SR_gold_transmission, SR_gold_specular, SR_gold_specular_color, SR_gold_ior, SR_gold_alpha, SR_gold_alpha_mode, SR_gold_alpha_cutoff, SR_gold_iridescence, SR_gold_iridescence_ior, SR_gold_iridescence_thickness, SR_gold_sheen_color, SR_gold_sheen_roughness, SR_gold_clearcoat, SR_gold_clearcoat_roughness, geomprop_Nworld_out1, SR_gold_emissive, SR_gold_emissive_strength, SR_gold_thickness, SR_gold_attenuation_distance, SR_gold_attenuation_color, SR_gold_out);
    material PBR_Gold_out = SR_gold_out;
    float outAlpha = clamp(1.0 - dot(PBR_Gold_out.transparency, vec3(0.3333)), 0.0, 1.0);
    out1 = vec4(mx_srgb_encode(PBR_Gold_out.color), outAlpha);
    if (outAlpha < u_alphaThreshold)
    {
        discard;
    }
}`

export default shader;