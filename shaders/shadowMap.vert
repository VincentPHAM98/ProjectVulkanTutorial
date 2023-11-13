#version 450


layout(binding = 0) uniform ModelUBO
{
    mat4 model;
} modelUBO;

layout(binding = 1) uniform ShadowMapUBO {
    mat4 viewProj;
} shadowMapUBO;

layout(location = 0) in vec3 inPosition;

void main() {
    gl_Position = shadowMapUBO.viewProj* modelUBO.model * vec4(inPosition, 1.f);
}   