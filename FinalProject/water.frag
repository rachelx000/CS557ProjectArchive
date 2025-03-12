#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;				  // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;					  // specular exponent
uniform vec4    uColor;

uniform sampler2D WaterNormal;

// in variables from the vertex shader and interpolated in the rasterizer:
in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec2  vST;					// texture coordinate

// constant variables
const vec3 SPECULARCOLOR        = vec3( 1., 1., 1. );

void
main( )
{	
	vec3 Normal = normalize( gl_NormalMatrix * (0.6*vN + 0.4*(2. * texture( WaterNormal, vST ).xyz - vec3(1., 1., 1.) )) );
	vec3 Light = normalize( vL );
    vec3 Eye = normalize( vE );

	// Standard Lighting Code
	vec3 ambient = uKa * uColor.rgb;
	float dd = abs(dot(Normal,Light));			   // do diffuse for both sides of the curtain
	vec3 diffuse = uKd * dd * uColor.rgb;

	float ss = 0.;
	if( dd > 0. )								   // only do specular if the light can see the point
	{
		vec3 ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
		ss = pow( max( dot( Eye, ref ),0. ), uShininess );
	}
	vec3 specular = uKs * ss * SPECULARCOLOR.rgb;

	gl_FragColor = vec4( ambient + diffuse + specular,  1. );
}
