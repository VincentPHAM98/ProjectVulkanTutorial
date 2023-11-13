#version 450

layout(binding = 0) uniform UniformBufferObject {
    mat4 view;
    mat4 proj;
    vec3 sunDir;
} ubo;

layout(binding = 2) uniform ModelUBO
{
    mat4 model;
} modelUBO;

layout(binding = 3) uniform ShadowMapUBO {
    mat4 viewProj;
} shadowMapUBO;

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inColor;
layout(location = 2) in vec2 inTexCoord;
layout(location = 3) in vec3 inNormal;

layout(location = 0) out vec3 fragColor;
layout(location = 1) out vec2 fragTexCoord;
layout(location = 2) out vec3 fragNormal;
layout(location = 4) out vec4 fragLightSpacePos;

void main() {
    vec3 tempPosition = inPosition;
    tempPosition.x += gl_InstanceIndex;

    vec4 worldPos = modelUBO.model * vec4(tempPosition, 1.0);
    fragLightSpacePos = shadowMapUBO.viewProj * worldPos;

    gl_Position = ubo.proj * ubo.view * worldPos;
    fragColor = inColor;
    fragTexCoord = inTexCoord;
    fragNormal = vec3((modelUBO.model * vec4(inNormal, 1.f)).xyz);
}   