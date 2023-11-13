#version 450

layout(binding = 5) uniform UniformBufferObject {
    vec3 sunVec;
    float specularHardness;

    vec3 viewVec;
    float specularPower;

    vec3 sunColor;
    float ambientScale;

    int shadowsPcfRadius;
    float shadowOffsetScale; 
} renderConstants;

layout(binding = 1) uniform sampler2D texSampler;
layout(binding = 4) uniform sampler2D shadowMapSampler;

layout(location = 0) in vec3 fragColor;
layout(location = 1) in vec2 fragTexCoord;
layout(location = 2) in vec3 fragNormal;
layout(location = 4) in vec4 fragLightSpacePos;

layout(location = 0) out vec4 outColor;

float rand(vec2 _input)
{
    return fract(sin(dot(_input.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float computeShadowFactor(vec4 _lightSpacePos)
{
    vec3 lightSpaceNDC = _lightSpacePos.xyz / _lightSpacePos.w;

    // Out of shadow map discard
    if (abs(lightSpaceNDC.x) > 1.f ||
        abs(lightSpaceNDC.y) > 1.f ||
        abs(lightSpaceNDC.z) > 1.f)
        {
            return 1.f;
        }

    // Translate from NDC to shadow map space (Vulkan's Z is already in [0..1])
    vec2 shadowMapUV = lightSpaceNDC.xy * 0.5f + 0.5f;

    float shadowAccumulation = 0.f;

    vec2 texelSize = 1.f / textureSize(shadowMapSampler, 0);
    int numSamplesSquared = renderConstants.shadowsPcfRadius;
    float randOffsetX;
    float randOffsetY;
    float offsetScale = renderConstants.shadowOffsetScale;

    for(int x = -numSamplesSquared; x <= numSamplesSquared; ++x)
    {
        for(int y = -numSamplesSquared; y <= numSamplesSquared; ++y)
        {
            randOffsetX = rand(shadowMapUV.xy + vec2(x, y)) * 2.f - 1.f;
            randOffsetY = rand(shadowMapUV.yx + vec2(x, y)) * 2.f - 1.f;

            randOffsetX *= offsetScale;
            randOffsetY *= offsetScale;

            float pcfDepth = texture(shadowMapSampler, shadowMapUV.xy + vec2(x + randOffsetX, y + randOffsetY) * texelSize).r; 
            shadowAccumulation += lightSpaceNDC.z > pcfDepth ? 0.f : 1.f;        
        }    
    }
    shadowAccumulation /= pow(numSamplesSquared + 1, 2);

    return shadowAccumulation;
}

void main() {
    vec3 color = texture(texSampler, fragTexCoord).xyz;

    vec3 ambient = renderConstants.ambientScale * renderConstants.sunColor;

    vec3 lambertDiffuse = max(0.f, dot(fragNormal, renderConstants.sunVec)) * renderConstants.sunColor;

    vec3 halfwayDir = normalize(renderConstants.sunVec + renderConstants.viewVec);
    vec3 specular = pow(max(dot(fragNormal, halfwayDir), 0.f), renderConstants.specularHardness) * renderConstants.specularPower * renderConstants.sunColor;

    float shadowFactor = computeShadowFactor(fragLightSpacePos);

    vec3 lighting = (ambient + shadowFactor * (lambertDiffuse + specular)) * color;

    outColor = vec4(lighting, 1.f);
}