#version 330 compatibility
#extension GL_EXT_gpu_shader4: enable
#extension GL_EXT_geometry_shader4: enable

layout( triangles ) in;
layout( line_strip, max_vertices=73 ) out;

uniform int		uLevel;
uniform float	uQuantize;
uniform float	uSize;
uniform float	uLightX, uLightY, uLightZ;

in  vec3	vN[3];
out vec3	gN;						// normal vector
out vec3	gL;						// vector from point to light
out vec3	gE;						// vector from point to eye
out float   gZ;						// Z depth in EC

vec3 V0, V1, V2;
vec3 V01, V02;
vec3 N0, N1, N2;
vec3 N01, N02;
vec3 LIGHTPOSITION = vec3( uLightX, uLightY, uLightZ );

vec3
Quantize( vec3 v )
{
	v *= uQuantize;		
    v += vec3( .5, .5, .5);			// rounding up
    ivec3 iv = ivec3( v );			// take the integer part
	v = vec3( iv );
    v /= uQuantize;					

	return v;
}


void
ProduceCrosses( float s, float t )
{
	// s and t interpolation:
	vec3 v = V0 + s*V01 + t*V02;
	v = Quantize( v );

	vec3 n = N0 + s*N01 + t*N02;
	gN = normalize( gl_NormalMatrix * n ); // normal vector

	vec4 ECposition = gl_ModelViewMatrix * vec4( v, 1. );
	gZ = -ECposition.z;
	gL = LIGHTPOSITION - ECposition.xyz;
	gE = vec3( 0., 0., 0. ) - ECposition.xyz;

	// translate v.x to the left side of the x cross-line you want to draw:
	v.x -= uSize;
	gl_Position = gl_ModelViewProjectionMatrix * vec4(v,1.);
	EmitVertex();

	// translate v.x to the right side of the x cross-line you want to draw:
	v.x += 2*uSize;
	gl_Position = gl_ModelViewProjectionMatrix * vec4(v,1.);
	EmitVertex();
	EndPrimitive( );
	// translate v.x back to its original value:
	v.x -= uSize;

	// now do the same for v.y:
	v.y -= uSize;
	gl_Position = gl_ModelViewProjectionMatrix * vec4(v,1.);
	EmitVertex();

	v.y += 2*uSize;
	gl_Position = gl_ModelViewProjectionMatrix * vec4(v,1.);
	EmitVertex();
	EndPrimitive( );

	v.y -= uSize;

	// now do the same for v.z:
	v.z -= uSize;
	gl_Position = gl_ModelViewProjectionMatrix * vec4(v,1.);
	EmitVertex();

	v.z += 2*uSize;
	gl_Position = gl_ModelViewProjectionMatrix * vec4(v,1.);
	EmitVertex();
	EndPrimitive( );
}

void
main( )
{
	V0  =   gl_PositionIn[0].xyz;
	V01 =   gl_PositionIn[1].xyz - V0;
	V02 =   gl_PositionIn[2].xyz - V0;

	N0  =   vN[0].xyz;
	N01 =   vN[1].xyz - N0;
	N02 =   vN[2].xyz - N0;

	// Triangle parametric interpolation:
	int numLayers = 1 << uLevel;
    float dt = 1. / float( numLayers );
    float t = 1.;
    for( int it = 0; it < numLayers; it++ )
    {
        float smax = 1. - t;

        int nums = it + 1;
        float ds = smax / float( nums - 1 );

        float s = 0.;
        
        for( int is = 0; is < nums; is++ )
        {
            ProduceCrosses( s, t );
            s += ds;
        }

        t -= dt;
    }
}
