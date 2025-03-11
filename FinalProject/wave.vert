#version 330 compatibility

// uniform variables for lighting:
uniform float uLightX, uLightY, uLightZ;

// uniform variables for the sine wave approximation:
uniform float	uDx, uDy;
uniform float	uAmp, uFreq, uSpeed;
uniform float   Timer;

// out variables:
out vec3 vN;
out vec3 vL;
out vec3 vE;


float SineWave( vec3 vertex, vec2 direction, float amplitude, float frequency, float speed, float time)
{
	float displaced_y = amplitude*sin(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	return displaced_y;
}

vec3 SineWaveNormal( vec3 vertex, vec2 direction, float amplitude, float frequency, float speed, float time)
{
	float ddx = frequency*direction.x*amplitude*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	float ddz = frequency*direction.y*amplitude*cos(dot(direction, vertex.xz)*frequency+speed*frequency*time);
	vec3 normal = normalize( vec3(-ddx, -ddz, 1.) );
	return normal;
}

void
main( )
{	
	// Calculate the new height of the vertex defined by the sine wave equation:
	vec3  vert = gl_Vertex.xyz;
	vec2  direct = vec2(uDx, uDy);
	float y = SineWave(vert, direct, uAmp, uFreq, uSpeed, Timer);		// Frequency = TWO_PI / Period
	vert.y += y ;	// displace the vertex

	// Calculate the normal after y-displacement by the sine wave:
	vN = SineWaveNormal(vert, direct, uAmp, uFreq, uSpeed, Timer);

	// Calculate the vectors for lighting:
	vec4 ECposition = gl_ModelViewMatrix * vec4( vert, 1. );
	vec3 LightPosition = vec3( uLightX, uLightY, uLightZ );		// light coordinate position
	vL = normalize( LightPosition - ECposition.xyz );           // vector from the point to the light position
	vE = normalize( vec3( 0., 0., 0. ) - ECposition.xyz );		// vector from the point to the eye position

	gl_Position = gl_ModelViewProjectionMatrix * vec4( vert, 1. );
}
