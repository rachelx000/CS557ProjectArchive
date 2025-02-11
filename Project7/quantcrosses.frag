// make this 120 for the mac:
#version 330 compatibility

uniform float   uKa, uKd, uKs;				  // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;					  // specular exponent
uniform vec4	uColor;
uniform bool    uUseChromaDepth;
uniform float   uRedDepth, uBlueDepth;

in  vec3  gN;                   // normal vector
in  vec3  gL;                   // vector from point to light
in  vec3  gE;                   // vector from point to eye
in	float gZ;

const vec4 SPECULARCOLOR = vec4( 1., 1., 1., 1. );

vec3
Rainbow( float t )
{
        t = clamp( t, 0., 1. );         // 0.00 is red, 0.33 is green, 0.67 is blue

        float r = 1.;
        float g = 0.0;
        float b = 1.  -  6. * ( t - (5./6.) );

        // b -> p;
        if( t <= (5./6.) )
        {
                r = 6. * ( t - (4./6.) );
                g = 0.;
                b = 1.;
        }
        // c -> b
        if( t <= (4./6.) )
        {
                r = 0.;
                g = 1.  -  6. * ( t - (3./6.) );
                b = 1.;
        }
        // g -> c
        if( t <= (3./6.) )
        {
                r = 0.;
                g = 1.;
                b = 6. * ( t - (2./6.) );
        }
        // y -> g
        if( t <= (2./6.) )
        {
                r = 1.  -  6. * ( t - (1./6.) );
                g = 1.;
                b = 0.;
        }
        // r -> y
        if( t <= (1./6.) )
        {
                r = 1.;
                g = 6. * t;         // red
        }

        return vec3( r, g, b );
}


void
main( )
{   
    vec3 myColor = uColor.rgb;
    if (uUseChromaDepth)
    {
        float t = (2./3.) * ( abs(gZ) - uRedDepth ) / ( uBlueDepth - uRedDepth );
        t = clamp( t, 0., 2./3. );          // Limit the rainbow range to r -> b
        myColor = Rainbow( t );
    }

	// Apply the per-fragmewnt lighting to the collection of 3D crosses:

	vec3 Normal = normalize(gN);
	vec3 Light  = normalize(gL);
	vec3 Eye    = normalize(gE);

	vec3 ambient = uKa * myColor;

	float dd = max( dot(Normal,Light), 0. );       // only do diffuse if the light can see the point
	vec3 diffuse = uKd * dd * myColor;

	float ss = 0.;
	if( dd > 0. )								   // only do specular if the light can see the point
	{
		vec3 ref = normalize(  reflect( -Light, Normal )  );
		ss = pow( max( dot(Eye,ref),0. ), uShininess );
	}
	vec3 specular = uKs * ss * SPECULARCOLOR.rgb;
	gl_FragColor = vec4( ambient + diffuse + specular,  1. );

}

